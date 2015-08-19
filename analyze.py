from pymongo import MongoClient
from bson.objectid import ObjectId
import matplotlib.pyplot as plt
import itertools
import random
import numpy as np
from collections import defaultdict
import os, sys

client = MongoClient('localhost', 5001)
db = client.meteor

NUMROUNDS = 10
NUMGAMES = 20
ROOT = '/home/lili/Desktop/'
#ROOT = '/Users/lilidworkin/Desktop/'

batchMap = {batch['name']: batch['_id'] for batch in db.ts.batches.find() if 'Day' in batch['name']}
batches = sorted(batchMap.keys(), key = lambda x: int(x.lstrip('Day')))


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


def plotFirstDefects():
    firstDefects = []
    for batchName in batches:
        for counter in range(1, NUMGAMES+1):
            instances = removeAbandoned(getInstances(batchName, counter))
            array = [x for x in [firstDefect(instance) for instance in instances] if x]
            firstDefects.append(mean(array))
    plt.plot(firstDefects)
    plt.show()


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
    endpoints = range(0, numSuperGames, 20)
    tuples = [(endpt, endpt+20) for endpt in endpoints]
    for tup in tuples:
        line = np.mean(matrix[:, tup[0]:tup[1]], axis=1)
        plt.plot(range(1,NUMROUNDS+1), line, label='Supergames %d-%d' % (tup[0]+1,tup[1]))
    plt.ylim((0, 1))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.legend(loc='lower left')
    plt.savefig(path + 'coop_vs_round.png')


def plotCoopPerGame(matrix):
    numSuperGames = matrix.shape[1]
    plt.plot(range(1, numSuperGames+1), np.mean(matrix, axis=0))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Supergame')
    plt.ylim((0, 1))
    plt.show()


def plotEachRound(matrix, path):
    elems = matrix.shape[0]*matrix.shape[1]
    reshaped = np.reshape(matrix, (1,elems), 'F')
    plt.plot(reshaped[0])
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.ylim((0, 1))
    plt.savefig(path + 'coop_vs_each_round.png')


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


def randomInst():
    instances = list(db.ts.experiments.find({'batchId': batchMap['Day1']}))
    index = random.randint(0, len(instances))
    return instances[index]['_id']


def mean(l):
    return float(sum(l))/len(l)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--group', default=None)
    parser.add_argument('--fill-defect', dest='fill_defect', action='store_true')
    args = parser.parse_args()
    print 'Group: %s' % args.group
    print 'Fill Defect: %s' % args.fill_defect
    group = int(args.group) if args.group else None
    pathA = 'both' if not args.group else args.group
    pathB = 'filled' if args.fill_defect else 'unfilled'
    path = ROOT + '%s-%s' % (pathA, pathB)
    if not os.path.exists(path):
        os.mkdir(path)
    matrix = genMatrix(group, args.fill_defect)
    plotRounds(matrix, path + '/')
    plt.clf()
    plotCoopPerRound(matrix, path + '/')
    plt.clf()
    plotEachRound(matrix, path + '/')

    
