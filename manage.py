import yaml
import mturk

me = True
sandbox = True

params = yaml.load(open('params.txt'))

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

question = """
<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd">
<ExternalURL>https://test.lilianne.me</ExternalURL>
<FrameHeight>800</FrameHeight>
</ExternalQuestion>
"""

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
        
