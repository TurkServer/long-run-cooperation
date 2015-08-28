from pymongo import MongoClient
from collections import defaultdict
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

batch_map = {batch['name']: batch['_id'] for batch in db.ts.batches.find() if 'Day' in batch['name']}
reverse_batch_map = {v:k for k, v in batch_map.items()}
batches = sorted(batch_map.keys(), key = lambda x: int(x.lstrip('Day')))
default_batch = batches[-1]

""" PLOTS """

def each_round_vs_supergame(matrix, path):
    """ one line for every round
        x axis is supergame """
    num_supergames = matrix.shape[1]
    rounds = np.array([1, 7, 8, 9, 10])-1
    for i in rounds:
        line = matrix[i, :]
        plt.plot(range(1,num_supergames+1), line, label='Round %d' % (i+1))
    plt.legend(loc='lower left')
    plt.ylim((0, 1))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Supergame')
    plt.savefig(path + 'each_round_vs_supergame.png')


def ave_round_vs_supergame(matrix, path):
    """ average coop over all rounds
        x axis is supergame """
    num_supergames = matrix.shape[1]
    plt.plot(range(1, num_supergames+1), np.mean(matrix, axis=0))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Supergame')
    plt.ylim((0, 1))
    plt.savefig(path + 'ave_round_vs_supergame.png')


def grouped_supergames_vs_round(matrix, path):
    """ one line for a bunch of supergames
        x axis is round """
    num_supergames = matrix.shape[1]
    group_size = 40
    endpoints = range(0, num_supergames, group_size)
    tuples = [(endpt, endpt+group_size) for endpt in endpoints]
    for tup in tuples:
        line = np.mean(matrix[:, tup[0]:tup[1]], axis=1)
        plt.plot(range(1,NUMROUNDS+1), line, label='Supergames %d-%d' % (tup[0]+1,tup[1]))
    plt.ylim((0, 1))
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.legend(loc='lower left')
    plt.savefig(path + 'grouped_supergame_vs_round.png')

# to do:
# -- each supergame vs round
# -- ave supergame vs round

def all_data(matrix, path):
    """ all data
        x axis is individual round """
    elems = matrix.shape[0]*matrix.shape[1]
    reshaped = np.reshape(matrix, (1,elems), 'F')
    plt.plot(reshaped[0])
    plt.ylabel('Fraction of Cooperation')
    plt.xlabel('Round')
    plt.ylim((0, 1))
    plt.savefig(path + 'coop_vs_each_round.png')

# to do:
# ave_session_vs_game_counter
# each_session_vs_game_counter
# ave_game_vs_session
# each_round_vs_session
# each_round_vs_game_counter

def plot_first_defects():
    first_defects = []
    for batch_name in batches:
        for counter in range(1, NUMGAMES+1):
            instances = remove_abandoned(get_instances(batch_name, counter))
            array = [x for x in [first_defect(instance) for instance in instances] if x]
            first_defects.append(mean(array))
    plt.plot(first_defects)
    plt.show()


""" PLOTS: Helpers """

def get_instances(batch_name, counter, group=None):
    gamegroups = list(db.gamegroups.find({'batchId': batch_map[batch_name],
                                          'counter': counter}));
    if group == 1:
        gamegroups = filter(lambda x: x['timestamp'].hour < 18, gamegroups)
    elif group == 3:
        gamegroups = filter(lambda x: x['timestamp'].hour >= 18, gamegroups)
    instances = [gamegroup['instances'] for gamegroup in gamegroups]
    return list(itertools.chain.from_iterable(instances))


def gen_matrix(group=None, fill_defection=False):
    num_supergames = len(batches) * 20;
    matrix = np.zeros((NUMROUNDS, num_supergames))
    round_frac_list = []
    for batch_name in batches:
        for counter in range(1, NUMGAMES+1):
            instances = get_instances(batch_name, counter, group)
            round_frac_list.append(filter(lambda x: x, [round_fracs(instance, fill_defection)
                                                        for instance in instances]))
    for i, row in enumerate(round_frac_list):
        matrix[:, i] = np.mean(row, axis=0)
    return matrix


def gen_matrix_user_centric(group=None, fill_defection=False):
    game_dict = gen_game_dict()
    num_supergames = len(game_dict)
    matrix = np.zeros((NUMROUNDS, num_supergames))
    for i, games in game_dict.items():
        row = filter(lambda x: x, [round_fracs(instance, fill_defection) for instance in games])
        matrix[:, i] = np.mean(row, axis=0)
    return matrix


def gen_game_Dict():
    worker_games_dict = gen_worker_games_dict()
    game_dict = defaultdict(list)
    for _, games in worker_games_dict.items():
        for index, game in enumerate(games):
            game_dict[index].append(game)
    return game_dict


def gen_worker_games_dict():
    workers = originally_qualified()
    map_ = {}
    for workerId in workers:
        experiments = []
        for batch in batches:
            asst = db.ts.assignments.find_one({'workerId': workerId,
                                               'batchId': batch_map[batch]})
            if not asst or not asst.get('instances'):
                continue
            experiments.extend([instance['id'] for instance in asst['instances']])
        map_[workerId] = experiments
    return map_

    
def remove_abandoned(instances):
    not_abandoned = []
    for instanceId in instances:
        game = db.ts.experiments.find_one({'_id': instanceId})
        if game['endReason'] == 'finished':
            not_abandoned.append(instanceId)
    return not_abandoned


def round_fracs(instanceId, fill_defection):
    game = db.ts.experiments.find_one({'_id': instanceId})
    rounds = get_rounds(instanceId)
    if game['endReason'] == 'finished':
        return round_fracs_finished(rounds)
    if fill_defection and is_punishment(rounds):
        return round_fracs_finished(fill_punishment(rounds))


def get_rounds(instanceId):
    round_objs = sorted(db.actions.find({'_groupId': instanceId}), key=lambda x: x['roundIndex'])
    rounds = [[action['action'] for action in actions]
              for _, actions in itertools.groupby(round_objs, key=lambda x: x['roundIndex'])]
    return rounds


def round_fracs_finished(rounds):
    round_frac = []
    for actions in rounds:
        coops = sum([action == 1 for action in actions])
        round_frac.append(float(coops)/2)
    return round_frac


def is_punishment(rounds):
    if len(rounds) < 2:
        return False
    cond1 = set(rounds[-2]) == set([1,2])
    cond2 = len(rounds[-1]) == 1 and rounds[-1][0] == 2
    return cond1 and cond2


def fill_punishment(rounds):
    filled_rounds = []
    for i in range(10):
        if i < len(rounds) - 1 and len(rounds[i]) == 2:
            filled_rounds.append(rounds[i])
        else:
            filled_rounds.append([2,2])
    return filled_rounds

    
def first_defect(instanceId):
    round_objs = sorted(db.actions.find({'_groupId': instanceId}), key=lambda x: x['roundIndex'])
    rounds = [list(actions) for _, actions in itertools.groupby(round_objs, key=lambda x: x['roundIndex'])]
    for index, actions in enumerate(rounds):
        choices = [action['action'] for action in actions]
        if 2 in choices:
            return index + 1
    return 11


""" SESSION ANALYSIS """

def print_unfinished_games(batch=default_batch):
    batch = default_batch if not batch else batch
    batchId = batch_map[batch]
    for exp in db.ts.experiments.find({'batchId': batchId}):
        if ((exp['endReason'] == 'abandoned') or (exp['endReason'] == 'torndown')):
            print_game(exp)


def print_worker_games(workerId, batch=default_batch):
    batch = default_batch if not batch else batch
    batchId = batch_map[batch]
    asst = db.ts.assignments.find_one({'batchId': batchId, 'workerId': workerId})
    for exp_obj in asst['instances']:
        exp = db.ts.experiments.find_one({'_id': exp_obj['id']})
        print_game(exp)


def print_game(exp):
    expId = exp['_id']
    users = exp['users']
    print 'Game %s' % expId
    rounds = db.rounds.find({'_groupId': expId}).sort('index', 1);
    for round_ in rounds:
        actions = list(db.actions.find({'_groupId': expId, 'roundIndex': round_['index']}))
        if round_['ended']:
            times = [action['timestamp'] for action in actions]
            delta = max(times) - min(times)
            try:
                print_round(round_['index'], users[0], round_['results'][users[0]]['action'],
                           users[1], round_['results'][users[1]]['action'], delta)
            except:
                print 'Unfinished round error'
        else:
            if len(actions) == 1:
                action = actions[0]
                print 'Round %d: %s - %d' % (round_['index'], action['userId'], action['action'])


def count_punishments():
    count = 0
    for exp in filter(lambda x: x['batchId'] in batch_map.values(), db.ts.experiments.find()):
        rounds = get_rounds(exp['_id'])
        count += is_punishment(rounds)
    print count


""" COOPERATION ANALYSIS """

def worker_coop_per_round(workerId, batch=default_batch):
    userId = db.users.find_one({'workerId': workerId})['_id']
    asst = db.ts.assignments.find_one({'batchId': batch_map[batch], 'workerId': workerId})
    coops = np.zeros(10)
    finished_games = 0
    for exp_obj in asst['instances']:
        exp = db.ts.experiments.find_one({'_id': exp_obj['id']})
        if exp['endReason'] != 'finished':
            continue
        finished_games += 1
        actions = db.actions.find({'_groupId': exp['_id'], 'userId': userId})
        for action in actions:
            round_index = action['roundIndex']
            coops[action['roundIndex']-1] += action['action'] == 1
    print coops/finished_games


def worker_coop(workerId, batch):
    userId = db.users.find_one({'workerId': workerId})['_id']
    asst = db.ts.assignments.find_one({'batchId': batch_map[batch], 'workerId': workerId})
    coop_fracs = []
    for exp_obj in asst.get('instances', []):
        exp = db.ts.experiments.find_one({'_id': exp_obj['id']})
        actions = list(db.actions.find({'_groupId': exp['_id'], 'userId': userId}))
        if actions:
            coop_fracs.append(float(sum([action['action'] == 1 for action in actions]))/len(actions))
    if coop_fracs:
        return np.mean(coop_fracs)


def batch_coop(batch):
    assts = db.ts.assignments.find({'batchId': batch_map[batch]})
    worker_coops = []
    for asst in assts:
        coop = worker_coop(asst['workerId'], batch)
        if coop:
            worker_coops.append(coop)
    return np.mean(worker_coops)


def gen_batch_coops():
    return {batch: batch_coop(batch) for batch in batches}
        

""" REVOKED ANALYSIS """

def originally_qualified():
    return db.ts.workeremails.find_one({'_id': 'NtDREvs8gkLt5AKGQ'})['recipients']


def get_qualified():
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
   

def investigate_revoked(batch_coops):
    revoked = list(set(originally_qualified()) - set(get_qualified()))
    all_worker_coop = []
    all_comm_coop = []
    for workerId in revoked:
        assts = sorted(db.ts.assignments.find({'workerId': workerId}), key = lambda x: x['acceptTime'])
        worker_coops = []
        comm_coops = []
        for asst in filter(lambda asst: asst['batchId'] in reverse_batch_map, assts):
            batch = reverse_batch_map[asst['batchId']]
            coop = worker_coop(workerId, batch)
            if coop:
                # print '%s: %.2f (%.2f)' % (batch, coop, batch_coops[batch])
                worker_coops.append(coop)
                comm_coops.append(batch_coops[batch])
        mean_worker_coop = np.mean(worker_coops)
        mean_comm_coop = np.mean(comm_coops)
        all_worker_coop.append(mean_worker_coop)
        all_comm_coop.append(mean_comm_coop)
        print '%.2f, %.2f' % (mean_worker_coop, mean_comm_coop)
    print 'Overall: %.2f, %.2f' % (np.mean(all_worker_coop), np.mean(all_comm_coop))


""" MISC """

def random_inst():
    instances = list(db.ts.experiments.find({'batchId': batch_map['Day1']}))
    index = random.randint(0, len(instances))
    return instances[index]['_id']


def mean(l):
    return float(sum(l))/len(l)


def print_round(index, user0, user0action, user1, user1action, delta):
    print 'Round %d: %s - %d, %s - %d (%s s)' % (index, user0, user0action, user1, user1action, delta.seconds)


def find_workerId(userId):
    user = db.users.find_one({'_id': userId})
    return user['workerId']
