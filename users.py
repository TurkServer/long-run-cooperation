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

QUAL1PM = "3VVYNZTOMVBFMVVFQ9LIE0E25G0ADC"
QUAL3PM = "3PHWYBUTF9AIGPJYVDU16PYGD2ZD59"

batchMap = {batch['name']: batch['_id'] for batch in db.ts.batches.find() if 'Day' in batch['name']}
reverseBatchMap = {batch['_id']: batch['name'] for batch in db.ts.batches.find() if 'Day' in batch['name']}
batches = sorted(batchMap.keys(), key = lambda x: int(x.lstrip('Day')))

defaultBatch = batches[-1]


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
   

def workerGames(workerId, batch=defaultBatch):
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
        

def investigateRevoked(batchCoops):
    revoked = list(set(originallyQualified()) - set(getQualified()))
    for workerId in revoked:
        assts = sorted(db.ts.assignments.find({'workerId': workerId}), key = lambda x: x['acceptTime'])
        for asst in filter(lambda asst: asst['batchId'] in reverseBatchMap, assts):
            batch = reverseBatchMap[asst['batchId']]
            coop = workerCoop(workerId, batch)
            if coop:
                print '%s: %.2f (%.2f)' % (batch, coop, batchCoops[batch])
        print
        
    
