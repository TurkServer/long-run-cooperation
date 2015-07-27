Actions = new Mongo.Collection('actions'); // one per action in each game -> roundIndex (1-10), userId, action (0/1), payoff
Rounds = new Mongo.Collection('rounds'); // one per round in each game -> index (1-10), actions (0-2), ended (true/false)
Games = new Mongo.Collection('games'); // one per instance -> state (playing, finished, abandoned), _groupId
Recruiting = new Mongo.Collection('recruiting'); 
Sessions = new Mongo.Collection('sessions'); // one per assignment (user/HIT)
GameGroups = new Mongo.Collection('gamegroups'); // one per next-game initiated -> instances (list of instance ids), counter (1-10)
TurkServer.partitionCollection(Actions);
TurkServer.partitionCollection(Rounds);
TurkServer.partitionCollection(Games);
TurkServer.partitionCollection(Recruiting);


