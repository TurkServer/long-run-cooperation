Meteor.methods({
    'recalculateBonuses': function(setBonus) {
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
    'grantQuals': function(qualId) {
	TurkServer.checkAdmin();
	console.log('grantQuals');
	var batchId = Batches.findOne({name: 'recruiting'})._id;
	var quals = 0;
	Assignments.find({
	    batchId: batchId,
	    status: 'completed',
	    'exitdata.participation': {$exists: true}
	}).forEach(function(asst) {
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    var worker = Workers.findOne({_id: asst.workerId});
	    if (worker && !worker.contact) {
		// should he be included?
		console.log(worker._id + " didn't check contact box, but said: " + asst.exitdata.participation);
	    }
	    //TurkServer.Util.assignQualification(asst.workerId, qualId, 1, false)
	    quals += 1;
	});
	console.log("Quals granted: " + quals);
    },
    'chooseSecondTime': function() {
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
