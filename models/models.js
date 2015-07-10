Rounds = new Mongo.Collection('rounds');
Sessions = new Mongo.Collection('sessions');
TurkServer.partitionCollection(Rounds);
