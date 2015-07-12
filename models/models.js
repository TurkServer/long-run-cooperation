Rounds = new Mongo.Collection('rounds');
Games = new Mongo.Collection('games'); 
Sessions = new Mongo.Collection('sessions'); // one per assignment (user/HIT)
TurkServer.partitionCollection(Rounds);
TurkServer.partitionCollection(Games);

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
    endRound: function(round, userIds, actions) {
	var payoffs = payoffMap[actions[userIds[0]]][actions[userIds[1]]];
	for (var i=0; i<=1; i++) {
	    Rounds.update({roundIndex: round,
			   userId: userIds[i]},
			  {$set: {payoff: payoffs[i]}});
	    Sessions.update({userId: userIds[i], 
			     day: today()}, // HACK
			    {$inc: {bonus: payoffs[i]*conversion}});
	}
	if (round == numRounds) {
	    for (var i=0; i<=1; i++) {
	    Sessions.update({userId: userIds[i],
			     day: today()}, // HACK
			    {$inc: {games: 1}});
	    }

	    Meteor.call('endGame', 'finished');
	} else {
	    Games.update({}, {$inc: {round: 1}});
	    Meteor.call('startTimer');
	}
    },
});



