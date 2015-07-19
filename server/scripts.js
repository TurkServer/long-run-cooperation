Meteor.methods({
    'payBonuses': function() {
	TurkServer.checkAdmin();
	Assignments.find({
	    "bonusPayment": {$gt: 0},
	    "bonusPaid": {$exists: false}
	}).forEach(function(asst) {
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    asstObj.payBonus('Bonus for the decision-making HIT.');
	});
    },
    'testAssigner': function() {
	TurkServer.checkAdmin();
	var batchid = Batches.findOne({name: 'main'})._id;
	for (var i=0; i<11; i++) {
	    var asst = addTestUser(batchid);
	    asst._enterLobby();
	    LobbyStatus.update({_id: userId}, {$set: {status: true}});
	}
    },
    'testGame': function() {
	TurkServer.checkAdmin();
	console.log('');
	var batchid = Batches.findOne({name: 'main'})._id;
	var batch = TurkServer.Batch.getBatch(batchid);
	var asst1 = addTestUser(batchid);
	var asst2 = addTestUser(batchid);
	var instance = batch.createInstance(['main']);
	instance.setup();
	instance.addAssignment(asst1);
	instance.addAssignment(asst2);
	var clientFunc = function(userId) {
	    for (var i=0; i<10; i++) {
		testingFuncs.chooseActionInternal(userId, 1);
	    }
	};
	Partitioner.bindGroup(instance.groupId, function() {
	    Meteor.defer(function() {clientFunc(asst1.userId)});
	    Meteor.defer(function() {clientFunc(asst2.userId)});
	});
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
