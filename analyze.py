from pymongo import MongoClient
from bson.objectid import ObjectId
import matplotlib.pyplot as plt
import itertools
import random
import numpy

client = MongoClient()
db = client.meteor


def mean(l):
    return float(sum(l))/len(l)


def active_users():
    gamegroups = sorted(db.gamegroups.find(), key=lambda x: x['counter'])
    num = [len(game['users']) for game in gamegroups]
    plt.plot(range(1,21), num)
    plt.ylabel('Number of active users')
    plt.xlabel('Game counter')
    plt.xlim((1,20))
    plt.xticks(range(1,21))
    plt.ylim((1,22))
    plt.yticks(range(22))
    plt.show()


def plotOne():
    coops = coopWrapper()
    games = [game['instances'] for game in sorted(db.gamegroups.find(), key=lambda x: x['counter'])]
    gameCoops = [[mean(coops.get(instanceId, [1])) for instanceId in games] for games in games]
    y = [mean(x) for x in gameCoops]
    plt.plot(range(1,21), y)
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Game counter')
    plt.xlim((1,20))
    plt.xticks(range(1,21))
    plt.show()


def plotTwo():
    games = [game['instances'] for game in sorted(db.gamegroups.find(), key=lambda x: x['counter'])]
    roundCoops = [[] for _ in range(10)]
    coops = coopWrapper()
    for games in games:
        gameGroupRoundCoop = [[] for _ in range(10)]
        for instanceId in games:
            roundCoop = coops.get(instanceId, numpy.ones(10))
            for roundIndex, coop in enumerate(roundCoop):
                gameGroupRoundCoop[roundIndex].append(coop)
        gameGroupRoundCoop = [mean(x) for x in gameGroupRoundCoop]
        for roundIndex, l in enumerate(roundCoops):
            roundCoops[roundIndex].append(gameGroupRoundCoop[roundIndex])
    y1 = [mean(x[:11]) for x in roundCoops]
    y2 = [mean(x[11:]) for x in roundCoops]
    plt.plot(range(1,11), y1, label='Games 1-10')
    plt.plot(range(1,11), y2, label='Games 11-20')
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.xlim((1,10))
    plt.xticks(range(1,11))
    plt.legend()
    plt.show()




def coopWrapper():
    instances = list(db.ts.experiments.find())
    coops = {}
    for instance in instances:
        instanceId = instance['_id']
        game = db.games.find_one({'_groupId': instanceId})
        if game['round'] == 10:
            coops[instanceId] = gameCoop(instanceId)
    return coops


def gameCoop(instanceId):
    roundObjs = sorted(db.rounds.find({'_groupId': instanceId}), key=lambda x: x['roundIndex'])
    rounds = [list(actions) for _, actions in itertools.groupby(roundObjs, key=lambda x: x['roundIndex'])]
    roundCoop = []
    for index, actions in enumerate(rounds):
        coops = sum([action['action'] == 1 for action in actions])
        roundCoop.append(float(coops)/2)
    return roundCoop


def payment():
    instances = list(db.ts.experiments.find())
    payoffs = []
    for instance in instances:
        users = instance['users']
        rounds = sorted(list(db.rounds.find({'_groupId': instance['_id']})), key = lambda x: x['timestamp'])
        user1_rounds = filter(lambda x: x['userId'] == users[0] and 'payoff' in x, rounds)
        user2_rounds = filter(lambda x: x['userId'] == users[1] and 'payoff' in x, rounds)
        if len(user1_rounds + user2_rounds) == 20:
            print [x['action'] for x in user1_rounds]
            print [x['action'] for x in user2_rounds]
            user1_payoff = sum([x['payoff'] for x in user1_rounds])
            user2_payoff = sum([x['payoff'] for x in user2_rounds])
            payoffs.extend([user1_payoff, user2_payoff])
        else:
            print rounds
    return payoffs


def timing():
    games = list(db.ts.experiments.find())
    to_seconds = lambda x: x.seconds
    deltas = [to_seconds(game['endTime'] - game['startTime']) for game in games]
    print 'Average game time: %.2f' % (float(sum(deltas))/len(deltas))
    print 'Max game time: %.2f' % max(deltas)
    print 'Min game time: %.2f' % min(deltas)
    start_times = [game['startTime'] for game in games]
    overall_delta = max(start_times) - min(start_times)
    print min(start_times)
    print max(start_times)
    print 'Overall length: %s' % overall_delta


def acceptances():
    assignments = db.ts.assignments.find()
    accepts = [item['acceptTime'] for item in assignments]
    print min(accepts)
    print max(accepts)
    

def investigate(instanceId):
    for round_ in sorted(db.rounds.find({'_groupId': instanceId}), key=lambda x: x['timestamp']):
        print 'Round: ' + str(round_['roundIndex'])
        print 'User: ' + round_['userId']
        print 'Action: ' + str(round_['action'])
        print


def randomInst():
    instances = list(db.ts.experiments.find())
    index = random.randint(0, len(instances))
    return instances[index]['_id']
