Meteor.publish('collections', function() {
    return [Meteor.users.find(), Rounds.find()];
});

Meteor.startup(function () {
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
	var end = new Date(start.getTime() + 2*60000);
	TurkServer.Timers.startNewRound(start, end, function() {});
    },
    chooseAction: function(action, round) {
	var oppId = Meteor.users.findOne({_id: {$ne:
						Meteor.userId()}})._id;
	Rounds.insert({timestamp: new Date(),
		       playerId: Meteor.userId(),
		       oppId: oppId,
		       roundIndex: round,
		       action: action});
	var rounds = Rounds.find({roundIndex: round});
	if (rounds.count() == 2) {
	    actions = {};
	    opponents = {};
	    rounds.forEach(function(obj) {
		actions[obj.playerId] = obj.action;
		opponents[obj.playerId] = obj.oppId;
	    });
	    for (var playerId in actions) {
		var myAction = actions[playerId];
		var oppAction = actions[opponents[playerId]];
		var payoff = payoffMap[myAction][oppAction];
		Rounds.update({roundIndex: round,
			       playerId: playerId},
			      {$set: {payoff: payoff}});
	    }
	    if (round < numRounds) {
		Meteor.call('startRound');
	    } else {
		TurkServer.Instance.currentInstance().teardown();
	    }
	}
    },
});
