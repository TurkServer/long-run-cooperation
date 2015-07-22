Meteor.publish('users', function() { return Meteor.users.find(); });
Meteor.publish('rounds', function() { return Rounds.find(); });
Meteor.publish('actions', function() { return Actions.find(); });
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
    if (this.instance.treatment().treatments.indexOf("recruiting") == -1) {
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

Partitioner.directOperation(function() {
    Rounds.find({actions: 2, ended: false}).observe({
	added: function(doc) {
	    Partitioner.bindGroup(doc._groupId, function() {
		endRound(doc.index);
	    });
	    Rounds.update({_id: doc._id},
			  {$set: {ended: true}});
	},		 
    });
});

var initGame = function() {
    Games.insert({state: 'active'});
    newRound(1);
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

var chooseActionInternal = function(userId, action) {
    var round = currentRound();
    var upsert = Actions.upsert({userId: userId,
				 roundIndex: round},
				{$setOnInsert: {
				    timestamp: new Date(),
				    action: action}});
    if (!upsert.insertedId) {
	console.log('Ignored action from ' + userId);
	return;
    }
    Rounds.update({index: round},
		  {$inc: {actions: 1}})
}

var endRound = function(round) {
    var actionObjs = Actions.find({roundIndex: round}).fetch();
    if (actionObjs.length !== 2) {
	console.log(actionObjs);
    }
    var userIds = [];
    var actions = {};
    var asst;
    _.each(actionObjs, function(round) {
	userIds.push(round.userId);
	actions[round.userId] = round.action;
    });
    var payoffs = payoffMap[actions[userIds[0]]][actions[userIds[1]]];
    for (var i=0; i<=1; i++) {
	Actions.update({roundIndex: round,
			userId: userIds[i]},
		       {$set: {payoff: payoffs[i]}});
	var asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
	Sessions.update({assignmentId: asst.assignmentId},
			{$inc: {bonus: payoffs[i]*conversion}});
    }
    if (round == numRounds) {
	for (var i=0; i<=1; i++) {
	    asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
	    Sessions.update({assignmentId: asst.assignmentId},
			    {$inc: {games: 1}});
	}
	endGame('finished');
    } else {
	newRound(round+1);
	startTimer();
    }
}

var newRound = function(round) {
    Rounds.insert({index: round,
		   actions: 0,
		   ended: false});
}

var endGame = function(state) {
    Games.update({}, {$set: {state: state}});
    TurkServer.Instance.currentInstance().teardown(false);
}

testingFuncs = {}
testingFuncs.chooseActionInternal = chooseActionInternal;
