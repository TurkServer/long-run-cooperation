Actions = new Mongo.Collection('actions'); // one per action in each game
Rounds = new Mongo.Collection('rounds'); // one per round in each game 
Games = new Mongo.Collection('games'); 
Recruiting = new Mongo.Collection('recruiting'); 
Sessions = new Mongo.Collection('sessions'); // one per assignment (user/HIT)
GameGroups = new Mongo.Collection('gamegroups'); // one per next-game initiated
TurkServer.partitionCollection(Actions);
TurkServer.partitionCollection(Rounds);
TurkServer.partitionCollection(Games);
TurkServer.partitionCollection(Recruiting);


