Meteor.methods({
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
    recalculateBonuses: function(setBonus) {
	TurkServer.checkAdmin();
	console.log('recalculateBonuses');
	Assignments.find().forEach(function(asst) {
	    console.log('Old bonus: ' + asst.bonusPayment);
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    var userId = asstObj.userId;
	    var points = 0;
	    Partitioner.directOperation(function() {
		Actions.find({'userId': userId}).forEach(function(action) {
		    points += action.payoff;
		});
	    });
	    var bonus = points*conversion;
	    console.log('New bonus: ' + bonus);
	    if (setBonus) {
		asstObj.setPayment(parseFloat(bonus.toFixed(2)));
	    }
	});
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
    grantQuals: function(actuallyGrant, qualId1PM, qualId3PM) {
	TurkServer.checkAdmin();
	console.log('grantQuals');
	var batchId = Batches.findOne({name: 'recruiting'})._id;
	var assts = getRecruited();
	var acceptAssts = [];
	_.each(assts, function(asst) {
	    var grantQual = true;
	    var worker = Workers.findOne({_id: asst.workerId});
	    if (!worker.contact) {
		grantQual = false;
	    }
	    var userId = Meteor.users.findOne({workerId: asst.workerId})._id;
	    var quizTime = Logs.findOne({_userId: userId, event: "goToQuiz"})._timestamp;
	    var instructionsTime = quizTime - asst.acceptTime;
	    if ((instructionsTime / 1000) < 30) {
		grantQual = false;
	    }
	    if (grantQual) {
		acceptAssts.push(asst);
	    }
	});
	var shuffledAssts = _.shuffle(acceptAssts);
	var midpt = Math.floor(shuffledAssts.length / 2);
	var assts1pm = shuffledAssts.slice(0, midpt+1);
	var assts3pm = shuffledAssts.slice(midpt+1, shuffledAssts.length);
	if (actuallyGrant) {
	    _.each(assts1pm, function(asst) {
		TurkServer.Util.assignQualification(asst.workerId, qualId1PM, 1, false)
	    });
	    _.each(assts3pm, function(asst) {
		TurkServer.Util.assignQualification(asst.workerId, qualId3PM, 1, false)
	    });
	}
	console.log("Total: " + acceptAssts.length);
	console.log("1 PM Group: " + assts1pm.length);
	console.log("3 PM Group: " + assts3pm.length);
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
    chooseSecondTime: function() {
	TurkServer.checkAdmin();
	console.log('chooseTime');
	var times = {};
	Workers.find().forEach(function(worker) {
	    var workerTimes = worker.available.times;
	    if (workerTimes.indexOf('12 -0500') == -1 &&
		workerTimes.indexOf('13 -0500') == -1) {
		_.each(workerTimes, function(time) {
		    if (time in times) {
			times[time] += 1;
		    } else {
			times[time] = 1;
		    }
		});
	    }
	});
	console.log(times);
    }
});

function getRecruited() {
    var batchId = Batches.findOne({name: 'recruiting'})._id;
    return Assignments.find({
	batchId: batchId,
	status: 'completed',
	'exitdata.participation': {$exists: true}
    }).fetch();
}

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
