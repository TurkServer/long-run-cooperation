Meteor.methods({
    forceGoToLobby: function(instanceId) {
	var inst = TurkServer.Instance.getInstance(instanceId);
	if (!inst.isEnded()) {
	    console.log('Instance has not ended yet.');
	    return;
	}
	var users = inst.users();
	_.each(users, function(user) {
	    var userGroup = Partitioner.getUserGroup(user);
	    if (userGroup != instanceId) {
		console.log('User ' + user + ' is not in that instance.');
	    } else {
		inst.sendUserToLobby(user);
		console.log('forceGoToLobby for ' + user + ' was successful.');
	    }
	})
    },
    clearUserGroups: function() {
	var cleared = 0;
	Meteor.users.find({group: {$exists: true}}).forEach(function(user) {
	    cleared += 1;
	    Partitioner.clearUserGroup(user._id);
	});
	console.log(cleared + ' users groups were cleared.');
    },
    newBatch: function(name) {
	Batches.upsert({name: name}, {name: name, active: true});
	var batchId = Batches.findOne({name: name})._id;
	TurkServer.Batch.getBatch(batchId).setAssigner(new TurkServer.Assigners.PairAssigner);
	Batches.update({name: name}, {$addToSet: {treatments: 'main'}});
	HITTypes.update({Title: hitTypeTitle1pm},
			{$set: {batchId: batchId}});
	HITTypes.update({Title: hitTypeTitle3pm},
			{$set: {batchId: batchId}});
    },
    getGameCount: function(name) {
	var batchId = Batches.findOne({name: name})._id;
	var batch = TurkServer.Batch.getBatch(batchId);
	var assigner = batch.assigner;
	console.log('Game counter: ' + assigner.counter);
	
    },
    setGameCount: function(name, count) {
	var batchId = Batches.findOne({name: name})._id;
	var batch = TurkServer.Batch.getBatch(batchId);
	var assigner = batch.assigner;
	assigner.counter = count;
	console.log('Game counter set at: ' + assigner.counter);
    },
    payBonuses: function(batchName, actuallyPay) {
	TurkServer.checkAdmin();
	console.log('payBonuses');
	var paid = 0;
	var batchId = Batches.findOne({name: batchName})._id;
	Assignments.find({
	    bonusPayment: {$gt: 0},
	    bonusPaid: {$exists: false},
	    status: "completed",
	    batchId: batchId
	}).forEach(function(asst) {
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    paid += 1;
	    if (actuallyPay) {
		asstObj.payBonus("Bonus for today's session of the month long research study.");
	    }
	});
	console.log(paid + ' Turkers were paid.');
    },
    revokeQuals: function(time) {
	var workers = getQualified(time);
	_.each(workers, function(worker) {
	    // logic to check if we need to revoke qual
	    revokeQual(worker._id, time);
	});
    },
    getQualifiedWorkers: function(time) {
	var workers = getQualified(time);
	console.log(workers.length + ' workers have that qualification.');
    },
    emailPanel: function(emailId, time) {
	var workers = getQualified(time);
	var workerIds = _.map(workers, function(worker) {
	    return worker._id;
	});
	WorkerEmails.update({_id: emailId},
			    {$set: {recipients: workerIds}});
    },
});

function getQualified(time) {
    var map = {1: Meteor.settings.Qual1PM,
	       3: Meteor.settings.Qual3PM};
    return Workers.find({
	quals: {$elemMatch: {id: map[time], value: 1}}
    }).fetch();
}


function revokeQual(workerId, time) {
    var map = {1: Meteor.settings.Qual1PM,
	       3: Meteor.settings.Qual3PM};
    var qualId = map[time];
    TurkServer.mturk('RevokeQualification', 
    		     {SubjectId: workerId,
    		      QualificationTypeId: qualId});
    Workers.update({_id: workerId},
		   {$pull: {quals: {id: qualId, value: 1}}});
}
