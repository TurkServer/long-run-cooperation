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

defaultBatch = batches[-1]


def userGames(workerId, batch=defaultBatch):
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
