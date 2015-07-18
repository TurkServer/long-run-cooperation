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
	var round = Games.findOne().round;
	var myTimestamp = new Date()
	Rounds.upsert({userId: Meteor.userId(),
		       roundIndex: round},
		      {$set: {timestamp: myTimestamp,
			      action: action}});
	var rounds = Rounds.find({roundIndex: round}).fetch();
	var endRoundFlag;
	if (rounds.length == 2) {
	    _.each(rounds, function(round) {
		if (round.userId != Meteor.userId()) {
		    endRoundFlag = myTimestamp > round.timestamp;
		}
	    });
	    if (endRoundFlag) {
		endRound(rounds, round);
	    }
	}
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
    var start = new Date();
    var end = new Date(start.getTime() + roundWait*60000);
    TurkServer.Timers.startNewRound(start, end);
}

var endRound = function(rounds, round) {
    var userIds = [];
    var actions = {};
    _.each(rounds, function(round) {
	userIds.push(round.userId);
	actions[round.userId] = round.action;
    });
    var payoffs = payoffMap[actions[userIds[0]]][actions[userIds[1]]];
    for (var i=0; i<=1; i++) {
	Rounds.update({roundIndex: round,
		       userId: userIds[i]},
		      {$set: {payoff: payoffs[i]}});
	var asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
	Sessions.update({assignmentId: asst.assignmentId},
			{$inc: {bonus: payoffs[i]*conversion}});
    }
    if (round == numRounds) {
	for (var i=0; i<=1; i++) {
	    var asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
	    Sessions.update({assignmentId: asst.assignmentId},
			    {$inc: {games: 1}});
	}
	endGame('finished');
    } else {
	Games.update({}, {$inc: {round: 1}});
	startTimer()
    }
}

var endGame = function(state) {
    Games.update({}, {$set: {state: state}});
    TurkServer.Instance.currentInstance().teardown(false);
}
