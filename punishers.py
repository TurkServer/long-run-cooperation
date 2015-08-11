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

batchMap = {batch['name']: batch['_id'] for batch in db.ts.batches.find() if 'Day' in batch['name']}
batches = sorted(batchMap.keys())

def investigate(batch='Day6'):
    batchId = batchMap[batch]
    for exp in db.ts.experiments.find({'batchId': batchId}):
        game = db.games.find_one({'_groupId': exp['_id']});
        if ((game['state'] == 'abandoned') or (game['state'] == 'torndown')):
            printGame(exp)


def findWorkerId(userId):
    user = db.users.find_one({'_id': userId})
    return user['workerId']

def userGames(workerId, batch='Day6'):
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
        if round_['ended']:
            printRound(round_['index'], users[0], round_['results'][users[0]]['action'],
                       users[1], round_['results'][users[1]]['action'])
        else:
            actions = list(db.actions.find({'_groupId': expId, 'roundIndex': round_['index']}))
            if len(actions) == 1:
                action = actions[0]
                print 'Round %d: %s - %d' % (round_['index'], action['userId'], action['action'])

def printRound(index, user0, user0action, user1, user1action):
    print 'Round %d: %s - %d, %s - %d' % (index, user0, user0action, user1, user1action)

    
if __name__ == '__main__':
    if 'investigate' in sys.argv:
        investigate(sys.argv[2])
    if 'user' in sys.argv:
        userGames(findWorkerId(sys.argv[2]), sys.argv[3])
