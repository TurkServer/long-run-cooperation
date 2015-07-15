import yaml
import mturk
from pymongo import MongoClient
from bson.objectid import ObjectId

me = True
sandbox = True

params = yaml.load(open('params.txt'))

""" Mongo Setup"""
client = MongoClient(params['mongoURI'])
db = client.meteor

"""MTurk Setup"""
if me:
    key = params['my_key']
    secret = params['my_secret']
else:
    key = params['sid_key']
    secret = params['sid_secret']
    
config = {'use_sandbox': sandbox,
          'stdout_log': False,
          'verify_mturk_ssl': True,
          'aws_key': key,
          'aws_secret_key': secret}

m = mturk.MechanicalTurk(config)

def clear_db():
    collections = db.collection_names()
    for collection in collections:
        if collection == 'users':
            db[collection].remove({'username': {'$ne': 'admin'}})
        elif 'system' not in collection and collection not in ['ts.hittypes', 'ts.batches', 'ts.treatments']:
            db[collection].remove({})

def print_users():
    users = db.users.find()
    for user in users:
        print user['username']
        print 'assignmentId: ' + user['assignmentId']
        print 'online: ' + str(user['status']['online'])
        print 'state: ' + user['state']
        print 'score: ' + str(user['score'])
        print 'createdAt: ' + str(user['createdAt'])
        print
        
def print_user_games():
    users = db.users.find()
    for user in users:
        print user['username']
        for game_id in user['games']:
            game = db.games.find_one({'_id': game_id})
            players = game['players']
            name1 = db.users.find_one({'_id': players[0]})['username']
            name2 = db.users.find_one({'_id': players[1]})['username']
            score1 = sum(game['scores'][players[0]])
            score2 = sum(game['scores'][players[1]])
            print '%s: %d, %s: %d' % (name1, score1, name2, score2)
    

question = """
<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">
<ExternalURL>https://test.lilianne.me</ExternalURL>
<FrameHeight>800</FrameHeight>
</ExternalQuestion>
"""

qualifications = [
    {'QualificationTypeId': mturk.LOCALE,
     'Comparator': 'In',
     'LocaleValue': [{'Country': 'US'}, {'Country':'CA'}]},
    {'QualificationTypeId': mturk.P_APPROVED,
     'Comparator': 'GreaterThanOrEqualTo',
     'IntegerValue': 95}
]

def create_qual():
    qual = {'Operation': 'CreateQualificationType',
            'Name': 'LiliTestingQual',
            'Description': 'Testing',
            'QualificationTypeStatus': 'Active'}
    r = m.request('CreateQualificationType', qual)
    print r

def assign_qual():
    qual = {'Operation': 'AssignQualification',
            'QualificationTypeId': '32S8022MNRS23UTOJ05BMBPRVO44LG',
            'WorkerId': ''}
    r = m.request('AssignQualification', qual)
    print r
            
def create_hit():
    hit = {'Title': 'Decision-Making Experiment',
           'Description': 'In this HIT you will play a sequence of games against random opponents and earn a bonus based on the decisions you make.',
           'Keywords': 'experiment,decision-making',
           'Question': question,
           'Reward': {'Amount': 0.25, 'CurrencyCode': 'USD'},
           'LifetimeInSeconds': 60*60*24,
           'AssignmentDurationInSeconds': 60*60,
           'MaxAssignments': 4,
           'AutoApprovalDelayInSeconds': 60,
           'QualificationRequirement': []}        
    r = m.request('CreateHIT', hit)
    print r


def notify():
    notify = {'Operation': 'NotifyWorkers',
              'Subject': 'TestSubject',
              'MessageText': 'TestBody',
              'WorkerId': ''}
    r = m.request('NotifyWorkers', notify)
    print r


def get_hits():
    get = {'Operation': 'SearchHITs'}
    r = m.request('SearchHITs', get)
    hitobjs = r['SearchHITsResponse']['SearchHITsResult']['HIT']
    return hitobjs

def expire_hit(id):
    expire = {'Operation': 'ForceExpireHIT',
              'HITId': id}
    r = m.request('ForceExpireHIT', expire)

def approve_assignments(id):
    assignments = {'Operation': 'GetAssignmentsForHit',
                    'HITId': id}
    r = m.request('GetAssignmentsForHIT', assignments)
    assignmentobjs = r['GetAssignmentsForHITResponse']['GetAssignmentsForHITResult'].get('Assignment')
    if not assignmentobjs:
        return
    if isinstance(assignmentobjs, dict):
        assignmentobjs = [assignmentobjs]
    for assignment in assignmentobjs:
        print assignment
        approve = {'Operation': 'ApproveAssignment',
                   'AssignmentId': assignment['AssignmentId']}
        r = m.request('ApproveAssignment', approve)
    

def delete_hits():
    get = {'Operation': 'SearchHITs'}
    r = m.request('SearchHITs', get)
    hitobjs = r['SearchHITsResponse']['SearchHITsResult']['HIT']
    if isinstance(hitobjs, dict):
        hitobjs = [hitobjs]
    hits = [x['HITId'] for x in hitobjs]
    for hitobj in hitobjs:        
        hit = hitobj['HITId']
        expire_hit(hit)
        approve_assignments(hit)
        delete = {'Operation': 'DisposeHIT',
        'HITId': hit}
        r = m.request('DisposeHIT', delete)
        
                
def get_hits():
    get = {'Operation': 'SearchHITs'}
    r = m.request('SearchHITs', get)
    return r['SearchHITsResponse']['SearchHITsResult']['HIT']
    
def grant_bonus():
    users = db.users.find()
    for user in users:
        if user['score'] > 0:
            amt = '%.2f' % (user['score']*0.0025)
            bonus = {'Operation': 'GrantBonus',
                     'WorkerId': user['username'],
                     'AssignmentId': user['assignmentId'],
                     'BonusAmount': {'Amount': amt, 'CurrencyCode': 'USD'},
                     'Reason': 'Bonus for decision-making HIT'}
            r = m.request('GrantBonus', bonus)
            print r

def time_games():
    games = db.games.find()
    times = []
    for game in games:
        roundTimes = game['roundTimes']
        length = roundTimes[-1] - roundTimes[0]
        times.append(length)
    print times
