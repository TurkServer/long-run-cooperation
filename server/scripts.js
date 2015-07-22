var sleep = Meteor.wrapAsync(function(time, cb) {
    return Meteor.setTimeout((function() {
	return cb(void 0);
    }), time);
});

Meteor.methods({
    'recalculateBonuses': function() {
	TurkServer.checkAdmin();
	console.log('recalculateBonuses');
	Assignments.find().forEach(function(asst) {
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    var userId = asstObj.userId;
	    var points = 0;
	    Partitioner.directOperation(function() {
		Rounds.find({'userId': userId}).forEach(function(round) {
		    if (!('payoff' in round)) {
			points += 5;
		    } else {
			points += round.payoff;
		    }
		});
	    });
	    var bonus = points*conversion;
	    asstObj.setPayment(parseFloat(bonus.toFixed(2)));
	});
    },
    'payBonuses': function() {
	TurkServer.checkAdmin();
	console.log('payBonuses');
	Assignments.find({
	    "bonusPayment": {$gt: 0},
	    "bonusPaid": {$exists: false},
	    "status": "completed"
	}).forEach(function(asst) {
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    asstObj.payBonus('Bonus for the decision-making HIT.');
	});
    },
    'testAssigner': function() {
	TurkServer.checkAdmin();
	clearDB();
	console.log('testAssigner');
	var batchid = Batches.findOne({name: 'main'})._id;
	for (var i=0; i<11; i++) {
	    var asst = addTestUser(batchid);
	    asst._enterLobby();
	    LobbyStatus.update({_id: userId}, {$set: {status: true}});
	}
	for (var j=0; j<numGames; j++) {
	    Meteor.call('ts-admin-lobby-event', batchid, 'next-game');
	    var gameGroup = GameGroups.findOne({counter: j+1});
	    console.log('Number of users in lobby: ' + gameGroup.users.length);
	    console.log('Left out user: ' + gameGroup.leftOut);
	    Meteor.call('ts-admin-stop-all-experiments', batchid);
	    LobbyStatus.update({}, {$set: {status: true}}, {multi: true})
	}
    },
    'testGame': function() {
	TurkServer.checkAdmin();
	clearDB();
	console.log('testGame');
	var batchid = Batches.findOne({name: 'main'})._id;
	var batch = TurkServer.Batch.getBatch(batchid);
	var asst1;
	var asst2;
	var instance;
	var addSession = function(asst) {
	    Sessions.insert({userId: asst.userId,
			     assignmentId: asst.assignmentId,
			     games: 0,
			     bonus: 0});
	};
	for (var j=0; j<5; j++) {
	    asst1 = addTestUser(batchid);
	    asst2 = addTestUser(batchid);
	    addSession(asst1);
	    addSession(asst2);
	    instance = batch.createInstance(['main']);
	    instance.setup();
	    instance.addAssignment(asst1);
	    instance.addAssignment(asst2);
	    Partitioner.bindGroup(instance.groupId, function() {
		var user1 = asst1.userId;
		var user2 = asst2.userId;
		var groupId = instance.groupId;
		Meteor.defer(function() {
		    Meteor.defer(function() {
			testingFuncs.chooseActionInternal(user1, 1);
		    });
		    Meteor.defer(function() {
			testingFuncs.chooseActionInternal(user2, 1);
		    });
		    var handle = Rounds.find({ended: true}).observe({
			added: function(doc) {
			    if (doc.index == numRounds) {
				handle.stop();
				return;
			    }
			    Partitioner.bindGroup(groupId, function() {
				Meteor.defer(function() {
				    testingFuncs.chooseActionInternal(user1, 1);
				});
				Meteor.defer(function() {
				    testingFuncs.chooseActionInternal(user2, 1);
				});
			    });
			}
		    });
		});
	    });
	}
    }
});

var addTestUser = function (batchid) {
    workerId = Random.id();
    userId = Accounts.insertUserDoc({}, {workerId: workerId});
    asst = TurkServer.Assignment.createAssignment({
	batchId: batchid,
	hitId: Random.id(),
	assignmentId: Random.id(),
	workerId: workerId,
	acceptTime: new Date(),
	status: "assigned"
    });
    return asst;
}

var clearDB = function() {
    Partitioner.directOperation(function() {
	Meteor.users.remove({'username': {$ne: 'admin'}});
	Actions.remove({});
	Rounds.remove({});
	Games.remove({});
	Sessions.remove({});
	RoundTimers.remove({});
	Experiments.remove({});
    });
}

