from pymongo import MongoClient
from bson.objectid import ObjectId
import matplotlib.pyplot as plt
import itertools

client = MongoClient()
db = client.meteor

# pilot things

games = [["FeFfLSSazQALHYWGm", "ReZMKmPcqyNJmAHbd", "erT5isCghEnGfZ7gw"],
         ["NB9QGdWASMA8zfbLR", "kDmAr96wBwzQhppSQ", "krurFiTsktX9wxbj7"],
         ["zRDDfrSKHB5kocnjf", "5ReHP6ZKePN5zpqm5"],
         ["AY43MC6HWA5m63Qfo", "2ivQLzvgxKmPXAgux"],
         ["PeWCziYMquY5xwrF2", "PZiqsCuy6SMohJJsG"],
         ["TBd2HHtoLD7HRmzvP", "vrNPPrde5LgPjXkFt"],
         ["G3wiJnchnKBvmsWdo", "3q3CStNLzzfPeqZWz"],
         ["tSi7ZS8MvdoTSunGc", "Ge88kj9LPwEAXfsMQ"],
         ["uXexr5scHgWq2AAJW", "NrfignX3hskLxFGAy"],
         ["drzeTT6nLyzxBbsj6"],
         ["n3hX58rGNva94xAJD"],
         ["mS6uYHsFp7uv7QpFJ"],
         ["4rSmc5NczaotDuMY4"],
         ["EbvbziYNHx338cmAh"],
         ["x8hWBug3PEGfSWdbe"],
         ["js6L2MjvpZYcQR8on"],
         ["KhojGEY8qRY7Piby6"],
         ["ZKHKqs7hcXjdxWrMt"],
         ["ovHEKNB44mRXxQfBf"],
         ["7Cqn2edHfiJnNnGwB"]]

def active_users():
    num = [len(game) for game in games]
    plt.plot(range(1,21), num)
    plt.ylabel('Number of game instances launched')
    plt.xlabel('Game counter')
    plt.ylim((0,4))
    plt.xlim((1,20))
    plt.xticks(range(1,21))
    plt.yticks(range(5))
    plt.show()

problems = ["PZiqsCuy6SMohJJsG", "Ge88kj9LPwEAXfsMQ", "x8hWBug3PEGfSWdbe", "js6L2MjvpZYcQR8on"]
    
def investigate(id):
    for round_ in sorted(db.rounds.find({'_groupId': id}), key=lambda x: x['timestamp']):
        print 'Round: ' + str(round_['roundIndex'])
        print 'User: ' + round_['userId']
        print 'Timestamp: ' + str(round_['timestamp'])
        print 'Payoff: ' + str(round_.get('payoff'))
        print
        
        
def getGame(_id):
    roundObjs = sorted(db.rounds.find({'_groupId': gameid}), key=lambda x: x['roundIndex'])
    rounds = []
    for index, actions in itertools.groupby(roundObjs, key=lambda x: x['roundIndex']):
        rounds.append(list(actions))
    for index, actions in enumerate(rounds):
        print 'Round %d' % index
        for action in sorted(actions, key=lambda x: x['userId']):
            print '%s: %d' % (action['userId'], action['action'])

def payment():
    games = list(db.ts.experiments.find())
    payoffs = []
    for game in games:
        users = game['users']
        rounds = sorted(list(db.rounds.find({'_groupId': game['_id']})), key = lambda x: x['timestamp'])
        user1_rounds = filter(lambda x: x['userId'] == users[0] and 'payoff' in x, rounds)
        user2_rounds = filter(lambda x: x['userId'] == users[1] and 'payoff' in x, rounds)
        if len(user1_rounds + user2_rounds) == 20:
            print [x['action'] for x in user1_rounds]
            print [x['action'] for x in user2_rounds]
            user1_payoff = sum([x['payoff'] for x in user1_rounds])
            user2_payoff = sum([x['payoff'] for x in user2_rounds])
            payoffs.extend([user1_payoff, user2_payoff])
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
    
