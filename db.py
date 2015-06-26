from pymongo import MongoClient
from bson.objectid import ObjectId

me = True
if me:
    client = MongoClient('mongodb://lilidworkin:lad1295@ds047592.mongolab.com:47592/meteor')
    db = client.meteor
else:
    client = MongoClient()
    db = client.lilianne_meteor_com

def delete_all():
    delete_games()
    delete_users()
    
def delete_games():
    db.games.remove(None)
    db.users.update_many({}, {'$set': {'games': []}})
        
def delete_users():
    db.users.remove(None)

def print_games():
    games = db.games.find()
    for game in games:
        id1 = game['players'][0]
        id2 = game['players'][1]
        name1 = db.users.find_one({'_id': id1})['username']
        name2 = db.users.find_one({'_id': id2})['username']
        score1 = sum(game['scores'][id1])
        score2 = sum(game['scores'][id2])
        print '%s: %d, %s: %d' % (name1, score1, name2, score2)

def print_users():
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
    
def status():
    for i in db.users.find():
        print i['username'], i['status']['online']
        
