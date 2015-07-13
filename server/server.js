Meteor.publish('users', function() { return Meteor.users.find(); });
Meteor.publish('rounds', function() { return Rounds.find(); });
Meteor.publish('games', function() { return Games.find(); });
Meteor.publish('sessions', function() { return Sessions.find(); }); // security vulnerability?

Meteor.startup(function () {
    // Indices
    Sessions._ensureIndex({hitId: 1, userId: 1});
    Rounds._ensureIndex({roundIndex: 1, userId: 1});

    // TESTING
    Batches.upsert({name: 'testing'}, {name: 'testing', active: true});
    var batchid = Batches.findOne({name: 'testing'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
});

TurkServer.initialize(function() {
    Meteor.call('initGame');
});

TurkServer.Timers.onRoundEnd(function() {
    var game = Games.findOne();
    if (game.state != 'finished') {
	Meteor.call('endGame', 'abandoned');
    }
});

Meteor.methods({
    initGame: function() {
	Games.insert({round: 1,
		      state: 'active'});
	Meteor.call('startTimer');
    },
    startTimer: function() {
	var start = new Date();
	var end = new Date(start.getTime() + roundWait*60000);
	TurkServer.Timers.startNewRound(start, end);
    },
    goToLobby: function() {
	var inst = TurkServer.Instance.currentInstance();
	inst.sendUserToLobby(Meteor.userId());
    },
    endGame: function(state) {
	Games.update({}, {$set: {state: state}});
	TurkServer.Instance.currentInstance().teardown(false);
    },
    setPayment: function() {
	var session = Sessions.findOne({assignmentId: assignmentId()});
	var bonus = session.bonus;
	var asst = TurkServer.Assignment.currentAssignment();
	asst.setPayment(parseFloat(bonus.toFixed(2)));
    }    
});
