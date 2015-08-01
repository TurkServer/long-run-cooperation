Meteor.methods({
    newBatch: function(name) {
	Batches.upsert({name: name}, {name: name, active: true});
	var batchId = Batches.findOne({name: name})._id;
	TurkServer.Batch.getBatch(batchId).setAssigner(new TurkServer.Assigners.PairAssigner);
	Batches.update({name: name}, {$addToSet: {treatments: 'main'}});
	HITTypes.upsert({batchId: batchId},
			{$set: {Title: 'Session for Month-Long Research Study',
				Description: '...',
				Keywords: 'study',
			        Reward: 0.1,
			        QualificationRequirement:["zkwuvJ9BX9BGWZod4", 
							  "ts6QjFu3SMis55ieq",
							  "o2NKn4Ksd2n5AoqHD"],
			        AssignmentDurationInSeconds: 7200,
			        AutoApprovalDelayInSeconds: 60}});
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
    payBonuses: function() {
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
    grantQuals: function(qualId) {
	TurkServer.checkAdmin();
	console.log('grantQuals');
	var batchId = Batches.findOne({name: 'recruiting'})._id;
	var quals = 0;
	var assts = getRecruited();
	_.each(assts, function(asst) {
	    var grantQual = true;
	    var worker = Workers.findOne({_id: asst.workerId});
	    if (worker && !worker.contact) {
		grantQual = false;
	    }
	    var userId = Meteor.users.findOne({workerId: asst.workerId})._id;
	    var quizTime = Logs.findOne({_userId: userId, event: "goToQuiz"})._timestamp;
	    var instructionsTime = quizTime - asst.acceptTime;
	    if ((instructionsTime / 1000) < 30) {
		grantQual = false;
	    }
	    if (grantQual) {
		// value of 2 is approval
		//TurkServer.Util.assignQualification(asst.workerId, qualId, 2, false)
		quals += 1;
	    }
	});
	console.log("Quals granted: " + quals);
    },
    revokeQual: function(userId, qualId) {
	var workers = getPanel();
	_.each(workers, function(worker) {
	    // logic to check if missed more than 2 days
	    // value of 1 is revocation
	    //TurkServer.Util.assignQualification(worker._id, qualId, 1, false)
	});
    },
    emailRecruits: function(emailId) {
	var assts = getRecruited();
	var workerIds = _.map(assts, function(asst) {
	    return asst.workerId;
	});
	WorkerEmails.update({_id: emailId},
			    {$set: {recipients: workerIds}});
    },
    emailRecruitsHardcoded: function() {
	var assts = getRecruited();
	var workerIds = _.map(assts, function(asst) {
	    return asst.workerId;
	});
	var subject = 'Information on the Month-Long Research Study HIT';
	var message = '...'
	WorkerEmails.insert({subject: subject,
			     message: message,
			     recipients: workerIds});
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

function getPanel(qualId) {
    return Workers.find({
	quals: {$elemMatch: {id: qualId, value: 2}}
    }).fetch();
}
