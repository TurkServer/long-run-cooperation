Counter = new Mongo.Collection('counter');

Meteor.publish('collections', function() {
    return [Meteor.users.find(), Rounds.find(), Sessions.find({userId: this.userId})];
});

Meteor.startup(function () {
    Sessions._ensureIndex({day: 1, userId: 1});
    Rounds._ensureIndex({roundIndex: 1, userId: 1});
    Batches.upsert({name: 'testing'}, {name: 'testing', active: true});
    var batchid = Batches.findOne({name: 'testing'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
});

TurkServer.initialize(function() {
    Meteor.call('startRound');
});

Meteor.methods({
    startRound: function() {
	var start = new Date();
	var end = new Date(start.getTime() + 10000);
	TurkServer.Timers.startNewRound(start, end, function() {
	    TurkServer.Instance.currentInstance().teardown(false);
	});
    },
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
		var asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
		var bonus = payoffs[i]*conversion;
		asst.addPayment(bonus);
		Sessions.update({userId: asst.userId, 
				 day: today()}, 
				{$inc: {bonus: bonus}});

	    }
	    if (round == numRounds) {
		for (var i=0; i<=1; i++) {
		    Sessions.update({userId: userIds[i],
				     day: today()},
				    {$inc: {games: 1}});
		}
		TurkServer.Instance.currentInstance().teardown(false);
	    } else {
		Meteor.call('startRound');
	    }
	}
    },
    goToLobby: function() {
	var inst = TurkServer.Instance.currentInstance();
	inst.sendUserToLobby(Meteor.userId());
    },
});
