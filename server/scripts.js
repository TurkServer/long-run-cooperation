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
	console.log('testAssigner');
	var batchid = Batches.findOne({name: 'main'})._id;
	for (var i=0; i<11; i++) {
	    var asst = addTestUser(batchid);
	    asst._enterLobby();
	    LobbyStatus.update({_id: userId}, {$set: {status: true}});
	}
    },
    'testGame': function() {
	TurkServer.checkAdmin();
	console.log('testGame');
	var batchid = Batches.findOne({name: 'main'})._id;
	var batch = TurkServer.Batch.getBatch(batchid);
	var asst1;
	var asst2;
	var instance;
	var clientFunc = function(userId) {
	    for (var i=0; i<200; i++) {
		testingFuncs.chooseActionInternal(userId, 1);
	    }
	};
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
		Meteor.defer(function() {clientFunc(asst1.userId)});
		Meteor.defer(function() {clientFunc(asst2.userId)});
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
