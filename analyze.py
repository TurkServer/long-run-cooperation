from pymongo import MongoClient
from bson.objectid import ObjectId
import matplotlib.pyplot as plt
import itertools
import random
import numpy as np
from collections import defaultdict

client = MongoClient('localhost', 5001)
db = client.meteor

numRounds = 10
numGames = 20

batchMap = {batch['name']: batch['_id'] for batch in db.ts.batches.find()}

def getInstances(batchName, counter):
    gamegroups = list(db.gamegroups.find({'batchId': batchMap[batchName],
                                          'counter': counter}));
    instances = [gamegroup['instances'] for gamegroup in gamegroups]
    return list(itertools.chain.from_iterable(instances))

def coopPerRound():
    batches = ['Day1', 'Day2']
    numSuperGames = len(batches) * 20;
    matrix = np.zeros((numRounds, numSuperGames))
    gameCoops = []
    for batchName in batches:
        for counter in range(1, numGames+1):
            instances = removeAbandoned(getInstances(batchName, counter))
            gameCoops.append([gameCoop(instance) for instance in instances])
    for i, row in enumerate(gameCoops):
        matrix[:, i] = np.mean(row, axis=0)
    return matrix

def plotRounds():
    matrix = coopPerRound()
    numSuperGames = matrix.shape[1]
    rounds = np.array([1, 8, 9, 10])-1
    for i in rounds:
        line = matrix[i, :]
        plt.plot(range(1,numSuperGames+1), line, label='Round %d' % (i+1))
    plt.legend(loc='lower left')
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Supergame')
    plt.show()

def plotCoopPerRound():
    matrix = coopPerRound()
    for tup in [(0,5), (12,17), (25,30), (30,40)]:
        line = np.mean(matrix[:, tup[0]:tup[1]], axis=1)
        plt.plot(range(1,numRounds+1), line, label='Supergames %d-%d' % (tup[0]+1,tup[1]))
    plt.ylim((0, 1))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.legend(loc='lower left')
    plt.show()


def plotCoopPerGame():
    batches = ['Day1', 'Day2']
    meanGameCoops = []
    for batchName in batches:
        for counter in range(1, numGames+1):
            instances = removeAbandoned(getInstances(batchName, counter))
            meanInstanceCoops = [mean(gameCoop(instance)) for instance in instances]
            meanGameCoops.append(mean(meanInstanceCoops))
    numSuperGames = len(batches) * 20;
    plt.plot(range(1, numSuperGames+1), meanGameCoops)
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Supergame')
    plt.xlim((1, numGames,))
    plt.ylim((0, 1))
    #plt.xticks(range(1, numSuperGames))
    plt.show()

    
def removeAbandoned(instances):
    notAbandoned = []
    for instanceId in instances:
        game = db.games.find_one({'_groupId': instanceId})
        if game['state'] == 'finished':
            notAbandoned.append(instanceId)
    return notAbandoned


def roundFracs(instanceId):
    roundObjs = sorted(db.actions.find({'_groupId': instanceId}), key=lambda x: x['roundIndex'])
    rounds = [list(actions) for _, actions in itertools.groupby(roundObjs, key=lambda x: x['roundIndex'])]
    roundCoop = []
    for index, actions in enumerate(rounds):
        coops = sum([action['action'] == 1 for action in actions])
        roundCoop.append(float(coops)/2)
    return roundCoop


def randomInst():
    instances = list(db.ts.experiments.find())
    index = random.randint(0, len(instances))
    return instances[index]['_id']

def mean(l):
    return float(sum(l))/len(l)
