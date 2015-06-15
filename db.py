from pymongo import MongoClient
from bson.objectid import ObjectId

#client = MongoClient('mongodb://127.0.0.1:3001/meteor')
client = MongoClient('mongodb://lilidworkin_meteor_com:853d8541-7756-67fe-c0b0-1dd696703f8a@production-db-c3.meteor.io/lilidworkin_meteor_com')

db = client.meteor

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
    
