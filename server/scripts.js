Meteor.methods({
    'payBonuses': function() {
	TurkServer.checkAdmin();
	Assignments.find({
	    "bonusPayment": {$gt: 0},
	    "bonusPaid": {$exists: false}
	}).forEach(function(asst) {
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    console.log(asstObj);
	    asstObj.payBonus('Bonus for the decision-making HIT.');
	});
    },
    'fakeData': function() {
	TurkServer.checkAdmin();
	var batchid = Batches.findOne({name: 'main'})._id;
	for (var i=0; i<11; i++) {
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
	    asst._enterLobby();
	    LobbyStatus.update({_id: userId}, {$set: {status: true}});
	}
    },
});
