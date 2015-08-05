Meteor.methods({
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
    grantNewQuals: function(actuallyGrant, qualId1PM, qualId3PM) {
	workers1pm = getFirstDay(1);
	workers3pm = getFirstDay(3);
	if (actuallyGrant) {
	    _.each(workers1pm, function(workerId) {
		TurkServer.Util.assignQualification(workerId, qualId1PM, 1, false)
	    });
	    _.each(workers3pm, function(workerId) {
		TurkServer.Util.assignQualification(workerId, qualId3PM, 1, false)
	    });
	}
	console.log("1 PM Group: " + workers1pm.length);
	console.log("3 PM Group: " + workers3pm.length);
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

function getFirstDay(time) {
    var batchId = Batches.findOne({name: 'Day1'})._id;
    var thresh = new Date("2015-08-04T17:30:00.000Z");
    if (time == 1) {
	var assignments = Assignments.find({batchId: batchId, acceptTime: {$lt: thresh}}).fetch();
    } else if (time == 3) {
	var assignments = Assignments.find({batchId: batchId, acceptTime: {$gt: thresh}}).fetch();
    }
    var workers = _.map(assignments, function(asst) {
	return asst.workerId;
    });
    return workers;
}
