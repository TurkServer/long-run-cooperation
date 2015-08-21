from pymongo import MongoClient
import matplotlib.pyplot as plt
import numpy as np
import itertools
import random

client = MongoClient('localhost', 5001)
db = client.meteor

NUMROUNDS = 10
NUMGAMES = 20

QUAL1PM = "3VVYNZTOMVBFMVVFQ9LIE0E25G0ADC"
QUAL3PM = "3PHWYBUTF9AIGPJYVDU16PYGD2ZD59"

batchMap = {batch['name']: batch['_id'] for batch in db.ts.batches.find() if 'Day' in batch['name']}
reverseBatchMap = {v:k for k, v in batchMap.items()}
batches = sorted(batchMap.keys(), key = lambda x: int(x.lstrip('Day')))
defaultBatch = batches[-1]

""" PLOTS """

def plotRounds(matrix, path):
    numSuperGames = matrix.shape[1]
    rounds = np.array([1, 7, 8, 9, 10])-1
    for i in rounds:
        line = matrix[i, :]
        plt.plot(range(1,numSuperGames+1), line, label='Round %d' % (i+1))
    plt.legend(loc='lower left')
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Supergame')
    plt.savefig(path + 'coop_vs_supergame.png')


def plotCoopPerRound(matrix, path):
    numSuperGames = matrix.shape[1]
    groupSize = 40
    endpoints = range(0, numSuperGames, groupSize)
    tuples = [(endpt, endpt+groupSize) for endpt in endpoints]
    for tup in tuples:
        line = np.mean(matrix[:, tup[0]:tup[1]], axis=1)
        plt.plot(range(1,NUMROUNDS+1), line, label='Supergames %d-%d' % (tup[0]+1,tup[1]))
    plt.ylim((0, 1))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.legend(loc='lower left')
    plt.savefig(path + 'coop_vs_round.png')


def plotEachRound(matrix, path):
    elems = matrix.shape[0]*matrix.shape[1]
    reshaped = np.reshape(matrix, (1,elems), 'F')
    plt.plot(reshaped[0])
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.ylim((0, 1))
    plt.savefig(path + 'coop_vs_each_round.png')


def plotCoopPerGame(matrix):
    numSuperGames = matrix.shape[1]
    plt.plot(range(1, numSuperGames+1), np.mean(matrix, axis=0))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Supergame')
    plt.ylim((0, 1))
    plt.show()


def plotFirstDefects():
    firstDefects = []
    for batchName in batches:
        for counter in range(1, NUMGAMES+1):
            instances = removeAbandoned(getInstances(batchName, counter))
            array = [x for x in [firstDefect(instance) for instance in instances] if x]
            firstDefects.append(mean(array))
    plt.plot(firstDefects)
    plt.show()


""" PLOTS: Helpers """

def getInstances(batchName, counter, group=None):
    gamegroups = list(db.gamegroups.find({'batchId': batchMap[batchName],
                                          'counter': counter}));
    if group == 1:
        gamegroups = filter(lambda x: x['timestamp'].hour < 18, gamegroups)
    elif group == 3:
        gamegroups = filter(lambda x: x['timestamp'].hour >= 18, gamegroups)
    instances = [gamegroup['instances'] for gamegroup in gamegroups]
    return list(itertools.chain.from_iterable(instances))


def genMatrix(group=None, fillDefection=False):
    numSuperGames = len(batches) * 20;
    matrix = np.zeros((NUMROUNDS, numSuperGames))
    roundFracList = []
    for batchName in batches:
        for counter in range(1, NUMGAMES+1):
            instances = getInstances(batchName, counter, group)
            roundFracList.append(filter(lambda x: x, [roundFracs(instance, fillDefection)
                                                      for instance in instances]))
    for i, row in enumerate(roundFracList):
        matrix[:, i] = np.mean(row, axis=0)
    return matrix


def removeAbandoned(instances):
    notAbandoned = []
    for instanceId in instances:
        game = db.ts.experiments.find_one({'_id': instanceId})
        if game['endReason'] == 'finished':
            notAbandoned.append(instanceId)
    return notAbandoned


def roundFracs(instanceId, fillDefection):
    game = db.ts.experiments.find_one({'_id': instanceId})
    rounds = getRounds(instanceId)
    if game['endReason'] == 'finished':
        return roundFracsFinished(rounds)
    if fillDefection and isPunishment(rounds):
        return roundFracsFinished(fillPunishment(rounds))


def getRounds(instanceId):
    roundObjs = sorted(db.actions.find({'_groupId': instanceId}), key=lambda x: x['roundIndex'])
    rounds = [[action['action'] for action in actions]
              for _, actions in itertools.groupby(roundObjs, key=lambda x: x['roundIndex'])]
    return rounds


def roundFracsFinished(rounds):
    roundFrac = []
    for actions in rounds:
        coops = sum([action == 1 for action in actions])
        roundFrac.append(float(coops)/2)
    return roundFrac


def isPunishment(rounds):
    if len(rounds) < 2:
        return False
    cond1 = set(rounds[-2]) == set([1,2])
    cond2 = len(rounds[-1]) == 1 and rounds[-1][0] == 2
    return cond1 and cond2


def fillPunishment(rounds):
    filledRounds = []
    for i in range(10):
        if i < len(rounds) - 1 and len(rounds[i]) == 2:
            filledRounds.append(rounds[i])
        else:
            filledRounds.append([2,2])
    return filledRounds

    
def firstDefect(instanceId):
    roundObjs = sorted(db.actions.find({'_groupId': instanceId}), key=lambda x: x['roundIndex'])
    rounds = [list(actions) for _, actions in itertools.groupby(roundObjs, key=lambda x: x['roundIndex'])]
    for index, actions in enumerate(rounds):
        choices = [action['action'] for action in actions]
        if 2 in choices:
            return index + 1
    return 11


""" SESSION ANALYSIS """

def printUnfinishedGames(batch=defaultBatch):
    batch = defaultBatch if not batch else batch
    batchId = batchMap[batch]
    for exp in db.ts.experiments.find({'batchId': batchId}):
        if ((exp['endReason'] == 'abandoned') or (exp['endReason'] == 'torndown')):
            printGame(exp)


def printWorkerGames(workerId, batch=defaultBatch):
    batch = defaultBatch if not batch else batch
    batchId = batchMap[batch]
    asst = db.ts.assignments.find_one({'batchId': batchId, 'workerId': workerId})
    for expObj in asst['instances']:
        exp = db.ts.experiments.find_one({'_id': expObj['id']})
        printGame(exp)


def printGame(exp):
    expId = exp['_id']
    users = exp['users']
    print 'Game %s' % expId
    rounds = db.rounds.find({'_groupId': expId}).sort('index', 1);
    for round_ in rounds:
        actions = list(db.actions.find({'_groupId': expId, 'roundIndex': round_['index']}))
        if round_['ended']:
            times = [action['timestamp'] for action in actions]
            delta = max(times) - min(times)
            printRound(round_['index'], users[0], round_['results'][users[0]]['action'],
                       users[1], round_['results'][users[1]]['action'], delta)
        else:
            if len(actions) == 1:
                action = actions[0]
                print 'Round %d: %s - %d' % (round_['index'], action['userId'], action['action'])


def countPunishments():
    count = 0
    for exp in filter(lambda x: x['batchId'] in batchMap.values(), db.ts.experiments.find()):
        rounds = getRounds(exp['_id'])
        count += isPunishment(rounds)
    print count


""" COOPERATION ANALYSIS """

def workerCoopPerRound(workerId, batch=defaultBatch):
    userId = db.users.find_one({'workerId': workerId})['_id']
    asst = db.ts.assignments.find_one({'batchId': batchMap[batch], 'workerId': workerId})
    coops = np.zeros(10)
    finishedGames = 0
    for expObj in asst['instances']:
        exp = db.ts.experiments.find_one({'_id': expObj['id']})
        if exp['endReason'] != 'finished':
            continue
        finishedGames += 1
        actions = db.actions.find({'_groupId': exp['_id'], 'userId': userId})
        for action in actions:
            roundIndex = action['roundIndex']
            coops[action['roundIndex']-1] += action['action'] == 1
    print coops/finishedGames


def workerCoop(workerId, batch):
    userId = db.users.find_one({'workerId': workerId})['_id']
    asst = db.ts.assignments.find_one({'batchId': batchMap[batch], 'workerId': workerId})
    coopFracs = []
    for expObj in asst.get('instances', []):
        exp = db.ts.experiments.find_one({'_id': expObj['id']})
        actions = list(db.actions.find({'_groupId': exp['_id'], 'userId': userId}))
        if actions:
            coopFracs.append(float(sum([action['action'] == 1 for action in actions]))/len(actions))
    if coopFracs:
        return np.mean(coopFracs)


def batchCoop(batch):
    assts = db.ts.assignments.find({'batchId': batchMap[batch]})
    workerCoops = []
    for asst in assts:
        coop = workerCoop(asst['workerId'], batch)
        if coop:
            workerCoops.append(coop)
    return np.mean(workerCoops)


def getBatchCoops():
    return {batch: batchCoop(batch) for batch in batches}
        

""" REVOKED ANALYSIS """

def originallyQualified():
    return db.ts.workeremails.find_one({'_id': 'NtDREvs8gkLt5AKGQ'})['recipients']


def getQualified():
    workers = db.ts.workers.find()
    workers1pm = []
    workers3pm = []
    for worker in workers:
        if 'quals' not in worker:
            continue
        qualIds = [qual['id'] for qual in worker['quals']]
        if QUAL1PM in qualIds:
            workers1pm.append(worker)
        elif QUAL3PM in qualIds:
            workers3pm.append(worker)
    workers = workers1pm + workers3pm
    return [worker['_id'] for worker in workers]
   

def investigateRevoked(batchCoops):
    revoked = list(set(originallyQualified()) - set(getQualified()))
    allWorkerCoop = []
    allCommCoop = []
    for workerId in revoked:
        assts = sorted(db.ts.assignments.find({'workerId': workerId}), key = lambda x: x['acceptTime'])
        workerCoops = []
        commCoops = []
        for asst in filter(lambda asst: asst['batchId'] in reverseBatchMap, assts):
            batch = reverseBatchMap[asst['batchId']]
            coop = workerCoop(workerId, batch)
            if coop:
                # print '%s: %.2f (%.2f)' % (batch, coop, batchCoops[batch])
                workerCoops.append(coop)
                commCoops.append(batchCoops[batch])
        meanWorkerCoop = np.mean(workerCoops)
        meanCommCoop = np.mean(commCoops)
        allWorkerCoop.append(meanWorkerCoop)
        allCommCoop.append(meanCommCoop)
        print '%.2f, %.2f' % (meanWorkerCoop, meanCommCoop)
    print 'Overall: %.2f, %.2f' % (np.mean(allWorkerCoop), np.mean(allCommCoop))


""" MISC """

def randomInst():
    instances = list(db.ts.experiments.find({'batchId': batchMap['Day1']}))
    index = random.randint(0, len(instances))
    return instances[index]['_id']


def mean(l):
    return float(sum(l))/len(l)


def printRound(index, user0, user0action, user1, user1action, delta):
    print 'Round %d: %s - %d, %s - %d (%s s)' % (index, user0, user0action, user1, user1action, delta.seconds)


def findWorkerId(userId):
    user = db.users.find_one({'_id': userId})
    return user['workerId']
