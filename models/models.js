Rounds = new Mongo.Collection('rounds');
Games = new Mongo.Collection('games'); 
Recruiting = new Mongo.Collection('recruiting'); 
Sessions = new Mongo.Collection('sessions'); // one per assignment (user/HIT)
GameGroups = new Mongo.Collection('gamegroups'); // one per next-game initiated
TurkServer.partitionCollection(Rounds);
TurkServer.partitionCollection(Games);
TurkServer.partitionCollection(Recruiting);


