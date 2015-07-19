Meteor.publish('users', function() { return Meteor.users.find(); });
Meteor.publish('rounds', function() { return Rounds.find(); });
Meteor.publish('games', function() { return Games.find(); });
Meteor.publish('recruiting', function() { return Recruiting.find(); });
Meteor.publish('sessions', function(userId) { 
    return Sessions.find({userId: userId}); 
});

Meteor.startup(function () {
    Batches.upsert({name: 'main'}, {name: 'main', active: true});
    Batches.upsert({name: 'recruiting'}, {name: 'recruiting', active: true});

    TurkServer.ensureTreatmentExists({name: 'main'});
    TurkServer.ensureTreatmentExists({name: 'recruiting'});

    var batchid = Batches.findOne({name: 'main'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
    Batches.update({name: 'main'}, {$addToSet: {treatments: 'main'}});

    var batchid = Batches.findOne({name: 'recruiting'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.SimpleAssigner);
    Batches.update({name: 'recruiting'}, {$addToSet: {treatments: 'recruiting'}});

});

TurkServer.initialize(function() {
    if (_.indexOf(this.instance.treatment().treatments, "recruiting") == -1) {
	initGame();
    } else {
	initRecruiting();
    }
});

TurkServer.Timers.onRoundEnd(function(reason) {
    if (reason === TurkServer.Timers.ROUND_END_TIMEOUT) {
	var game = Games.findOne();
	if (game.state != 'finished') {
	    endGame('abandoned');
	}
    }
});

Meteor.methods({
    goToLobby: function() {
	var inst = TurkServer.Instance.currentInstance();
	inst.sendUserToLobby(Meteor.userId());
    },
    chooseAction: function(action) {
	var timestamp = new Date();
	chooseActionInternal(Meteor.userId(), action);
    },
    setPayment: function() {
	var asst = TurkServer.Assignment.currentAssignment();
	var session = Sessions.findOne({assignmentId: asst.assignmentId});
	var bonus = session.bonus;
	asst.setPayment(parseFloat(bonus.toFixed(2)));
    },
    goToQuiz: function() {
	Recruiting.update({}, {$set: {'state': 'quiz'}});
    },
    incQuiz: function() {
	Recruiting.update({}, {$inc: {'attempts': 1}});
    },
    endQuiz: function() {
	TurkServer.Instance.currentInstance().teardown();
    },
});

var initGame = function() {
    Games.insert({round: 1,
		  state: 'active'});
    startTimer();
}

var initRecruiting = function() {
    Recruiting.insert({state: 'consent',
		       attempts: 0});
}

var startTimer = function() {
    start = new Date();
    end = new Date(start.getTime() + roundWait*60000);
    TurkServer.Timers.startNewRound(start, end);
}

var chooseActionInternal = function(userId, action) {
    var round = Games.findOne().round;
    var exists = Rounds.findOne({userId: userId,
				 roundIndex: round});
    if (exists) { return; }
    Rounds.insert({userId: userId,
		   roundIndex: round,
		   timestamp: new Date(),
		   action: action});
    var rounds = Rounds.find({roundIndex: round}).fetch();
    var timestamps = {};
    var otherId;
    if (rounds.length == 2) {
	_.each(rounds, function(round) {
	    timestamps[round.userId] = round.timestamp;
	    if (round.userId != userId) {
		otherId = round.userId;
	    }
	});
	if (timestamps[userId] > timestamps[otherId]) {
	    endRound(rounds, round);
	} else if (timestamps[userId].getTime() == timestamps[otherId].getTime()) {
	    // if they really pressed the button at the same time,
	    // just remove both objects and let them click again
	    // but don't compare the two Date objects directly:
	    // http://stackoverflow.com/a/493018
	    Rounds.remove({userId: userId,
			   roundIndex: round});
	}
    }
}

var endRound = function(rounds, round) {
    userIds = [];
    actions = {};
    _.each(rounds, function(round) {
	userIds.push(round.userId);
	actions[round.userId] = round.action;
    });
    payoffs = payoffMap[actions[userIds[0]]][actions[userIds[1]]];
    for (i=0; i<=1; i++) {
	Rounds.update({roundIndex: round,
		       userId: userIds[i]},
		      {$set: {payoff: payoffs[i]}});
	asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
	Sessions.update({assignmentId: asst.assignmentId},
			{$inc: {bonus: payoffs[i]*conversion}});
    }
    if (round == numRounds) {
	for (i=0; i<=1; i++) {
	    asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
	    Sessions.update({assignmentId: asst.assignmentId},
			    {$inc: {games: 1}});
	}
	endGame('finished');
    } else {
	Games.update({}, {$inc: {round: 1}});
	startTimer();
    }
}

var endGame = function(state) {
    Games.update({}, {$set: {state: state}});
    TurkServer.Instance.currentInstance().teardown(false);
}

testingFuncs = {}
testingFuncs.chooseActionInternal = chooseActionInternal;
