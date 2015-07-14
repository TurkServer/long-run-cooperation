Rounds = new Mongo.Collection('rounds');
Games = new Mongo.Collection('games'); 
Recruiting = new Mongo.Collection('recruiting'); 
Sessions = new Mongo.Collection('sessions'); // one per assignment (user/HIT)
TurkServer.partitionCollection(Rounds);
TurkServer.partitionCollection(Games);
TurkServer.partitionCollection(Recruiting);

Meteor.methods({
    chooseAction: function(action, round) {
	Rounds.insert({timestamp: new Date(),
		       userId: Meteor.userId(),
		       roundIndex: round,
		       action: action});
	var rounds = Rounds.find({roundIndex: round});
	if (rounds.count() == 2) {
	    var userIds = [];
	    var actions = {};
	    rounds.forEach(function(obj) {
		userIds.push(obj.userId);
		actions[obj.userId] = obj.action;
	    });
	    Meteor.call('endRound', round, userIds, actions);
	}
    },
    goToQuiz: function() {
	Recruiting.update({}, {$set: {'state': 'quiz'}});
    },
    incQuiz: function() {
	Recruiting.update({}, {$inc: {'attempts': 1}});
    }
});



