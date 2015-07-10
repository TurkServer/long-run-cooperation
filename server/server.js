Meteor.publish('collections', function() {
    return [Meteor.users.find(), Rounds.find()];
});

Meteor.startup(function () {
    Batches.upsert({name: 'testing'}, {name: 'testing', active: true});
    var batchid = Batches.findOne({name: 'testing'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
    
    //var batch = Batches.findOne({name: 'testing'});
    //batch.setAssigner(new TurkServer.Assigners.PairAssigner);
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
	Rounds.insert({timestamp: new Date(),
		       playerId: Meteor.userId(),
		       roundIndex: round,
		       action: action});
	var rounds = Rounds.find({roundIndex: round});
	var playerIds = [];
	var actions = {};
	if (rounds.count() == 2) {
	    rounds.forEach(function(obj) {
		playerIds.push(obj.playerId);
		actions[obj.playerId] = obj.action;
	    });
	    var payoffs = payoffMap[actions[playerIds[0]]][actions[playerIds[1]]];
	    for (var i=0; i<=1; i++) {
		Rounds.update({roundIndex: round,
			       playerId: playerIds[i]},
			      {$set: {payoff: payoffs[i]}});
		var asst = TurkServer.Assignment.getCurrentUserAssignment(playerIds[i]);
		asst.addPayment(payoffs[i]);
	    }
	    Meteor.call('startRound');
	}
    },
    goToLobby: function() {
	var batch = TurkServer.Batch.currentBatch();
	var asst = TurkServer.Assignment.currentAssignment();
	var inst = TurkServer.Instance.currentInstance();
	Partitioner.clearUserGroup(Meteor.userId());
	asst._leaveInstance(inst._id);
	batch.lobby.addAssignment(asst);
    },
    endGame: function() {
	TurkServer.Instance.currentInstance().teardown();
    }
});
