Meteor.publish('users', function() { return Meteor.users.find(); });
Meteor.publish('rounds', function() { return Rounds.find(); });
Meteor.publish('actions', function() { return Actions.find(); });
Meteor.publish('games', function() { return Games.find(); });
Meteor.publish('recruiting', function() { return Recruiting.find(); });

Meteor.startup(function () {
    Batches.upsert({name: 'pilot'}, {name: 'pilot', active: true});
    Batches.upsert({name: 'experiment'}, {name: 'experiment', active: true});
    Batches.upsert({name: 'recruiting'}, {name: 'recruiting', active: true});

    TurkServer.ensureTreatmentExists({name: 'main'});
    TurkServer.ensureTreatmentExists({name: 'recruiting'});

    var batchid = Batches.findOne({name: 'pilot'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
    Batches.update({name: 'pilot'}, {$addToSet: {treatments: 'main'}});

    var batchid = Batches.findOne({name: 'experiment'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
    Batches.update({name: 'experiment'}, {$addToSet: {treatments: 'main'}});

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
	chooseActionInternal(Meteor.userId(), action);
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
	}
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
	console.log('More/less than 2 action objects: ');
	console.log(actionObjs);
    }
    var userIds = [];
    var actions = [];
    _.each(actionObjs, function(obj) {
	userIds.push(obj.userId);
	actions.push(obj.action);
    });
    var payoffs = payoffMap[actions[0]][actions[1]];
    var results = {};
    results[userIds[0]] = {action: actions[0], payoff: payoffs[0]};
    results[userIds[1]] = {action: actions[1], payoff: payoffs[1]};
    for (var i=0; i<=1; i++) {
    	var asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
    	asst.addPayment(payoffs[i]*conversion);
    };
    if (round == numRounds) {
	endGame('finished');
    } else {
	newRound(round+1);
	startTimer();
    }
    Rounds.update({index: round}, {$set: {results: results, ended: true}});
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

testingFuncs.chooseActionInternal = chooseActionInternal;
