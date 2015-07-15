Meteor.publish('users', function() { return Meteor.users.find(); });
Meteor.publish('rounds', function() { return Rounds.find(); });
Meteor.publish('games', function() { return Games.find(); });
Meteor.publish('recruiting', function() { return Recruiting.find(); });
Meteor.publish('sessions', function(userId) { 
    return Sessions.find({userId: userId}); 
}); 

Meteor.startup(function () {
    Batches.upsert({name: 'testing'}, {name: 'testing', active: true});
    Batches.upsert({name: 'pilot'}, {name: 'pilot', active: true});
    Batches.upsert({name: 'recruiting'}, {name: 'recruiting', active: true});

    TurkServer.ensureTreatmentExists({name: 'main'});
    TurkServer.ensureTreatmentExists({name: 'recruiting'});

    var batchid = Batches.findOne({name: 'testing'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
    Batches.update({name: 'testing'}, {$addToSet: {treatments: 'main'}});

    var batchid = Batches.findOne({name: 'pilot'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
    Batches.update({name: 'pilot'}, {$addToSet: {treatments: 'main'}});

    var batchid = Batches.findOne({name: 'recruiting'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.SimpleAssigner);
    Batches.update({name: 'recruiting'}, {$addToSet: {treatments: 'recruiting'}});

});

TurkServer.initialize(function() {
    if (_.indexOf(this.instance.treatment().treatments, "recruiting") == -1) {
	Meteor.call('initGame');
    } else {
	Meteor.call('initRecruiting');
    }
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
    initRecruiting: function() {
	Recruiting.insert({state: 'instructions',
			   attempts: 0});
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
	    Meteor.call('endGame', 'finished');
	} else {
	    Games.update({}, {$inc: {round: 1}});
	    Meteor.call('startTimer');
	}
    },
    endGame: function(state) {
	Games.update({}, {$set: {state: state}});
	TurkServer.Instance.currentInstance().teardown(false);
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
