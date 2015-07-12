Rounds = new Mongo.Collection('rounds');
Games = new Mongo.Collection('games'); 
Sessions = new Mongo.Collection('sessions'); // one per assignment (user/HIT)
Players = new Mongo.Collection('players'); // one per user
TurkServer.partitionCollection(Rounds);
TurkServer.partitionCollection(Games);

Meteor.methods({
    chooseAction: function(action, round) {
	Rounds.insert({timestamp: new Date(),
		       userId: Meteor.userId(),
		       roundIndex: round,
		       action: action});
	var rounds = Rounds.find({roundIndex: round});
	var userIds = [];
	var actions = {};
	if (rounds.count() == 2) {
	    rounds.forEach(function(obj) {
		userIds.push(obj.userId);
		actions[obj.userId] = obj.action;
	    });
	    var payoffs = payoffMap[actions[userIds[0]]][actions[userIds[1]]];
	    for (var i=0; i<=1; i++) {
		Rounds.update({roundIndex: round,
			       userId: userIds[i]},
			      {$set: {payoff: payoffs[i]}});
		//var asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
		var bonus = payoffs[i]*conversion;
		//asst.addPayment(bonus);
		Sessions.update({userId: userIds[i], 
				 day: today()}, 
				{$inc: {bonus: bonus}});
	    }
	    if (round == numRounds) {
		for (var i=0; i<=1; i++) {
		    Sessions.update({userId: userIds[i],
				     day: today()},
				    {$inc: {games: 1}});
		}
		Games.update({}, {$set: {state: 'finished'}});
		Meteor.call('endGame');
	    } else {
		Games.update({}, {$inc: {round: 1}});
		Meteor.call('startTimer');
	    }
	}
    }
});



