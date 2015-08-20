Meteor.methods({
    endUnfinishedRounds: function() {
	TurkServer.checkAdmin();
	var result = Rounds.direct.update({actions: 2, ended: false}, {$set: {ended: true}}, {multi: true});
	console.log('Ended ' + result + ' unfinished rounds.');
    },
    forceGoToLobby: function(instanceId) {
	TurkServer.checkAdmin();
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
	TurkServer.checkAdmin();
	var cleared = 0;
	Meteor.users.find({group: {$exists: true}}).forEach(function(user) {
	    cleared += 1;
	    Partitioner.clearUserGroup(user._id);
	});
	console.log(cleared + ' users groups were cleared.');
    },
    newBatch: function(name) {
	TurkServer.checkAdmin();
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
	TurkServer.checkAdmin();
	var batchId = Batches.findOne({name: name})._id;
	var batch = TurkServer.Batch.getBatch(batchId);
	var assigner = batch.assigner;
	assigner.counter = count;
	console.log('Game counter set at: ' + assigner.counter);
    },
    recalculateBonus: function(userId, batchName, setBonus) {
	TurkServer.checkAdmin();
	var batchId = Batches.findOne({name: batchName})._id;
	var workerId = Meteor.users.findOne({_id: userId}).workerId;
	console.log('Recalculating bonus for: ' + workerId);
    	var asst = Assignments.findOne({workerId: workerId, batchId: batchId});
	console.log('Old bonus: ' + asst.bonusPayment);
	var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	var instances = _.map(asst.instances, function(instance) {
	    return instance.id;
	});
	var userId = asstObj.userId;
	var points = 0;
	Partitioner.directOperation(function() {
	    Rounds.find({_groupId: {$in: instances}}).forEach(function(round) {
		try {
		    points += round.results[userId].payoff;
		} catch (e) {
		    points += 0;
		}
	    });
	});
	var bonus = points*conversion;
	console.log('New bonus: ' + bonus);
	if (setBonus) {
	    asstObj.setPayment(parseFloat(bonus.toFixed(2)));
	    console.log('Reset bonus.');
	}
    },
    payExtraBonuses: function(workerIds, amt, message, actuallyGrant) {
	TurkServer.checkAdmin();
	_.each(workerIds, function(workerId) {
	    var assignments = Assignments.find({workerId: workerId}, {sort: {acceptTime: -1}}).fetch();
	    var recentAsst = assignments[0];
	    var data = {
		WorkerId: workerId,
		AssignmentId: recentAsst.assignmentId,
		BonusAmount: {
		    Amount: amt,
		    CurrencyCode: "USD"
		},
		Reason: message
	    };
	    console.log(data);
	    if (actuallyGrant) {
		TurkServer.mturk("GrantBonus", data);
		console.log('Paid ' + workerId);
	    } else {
		console.log('Would have paid ' + workerId);
	    }
	});
    },
    payReturnedBonus: function(userId, batchName, actuallyPay) {
	TurkServer.checkAdmin();
	console.log('payReturnedBonuses');
	var workerId = Meteor.users.findOne({_id: userId}).workerId;
	var batchId = Batches.findOne({name: batchName})._id;
	var assignments = Assignments.find({workerId: workerId,
					    status: "completed"}, 
					   {sort: {acceptTime: -1}}).fetch();
	var recentAsst = assignments[0];
	var returnedAsst = Assignments.findOne({
	    workerId: workerId,
	    bonusPayment: {$gt: 0},
	    bonusPaid: {$exists: false},
	    status: "returned",
	    batchId: batchId
	});
	var amt = returnedAsst.bonusPayment.toFixed(2);
	var data = {
	    WorkerId: workerId,
	    AssignmentId: recentAsst.assignmentId,
	    BonusAmount: {
		Amount: amt,
		CurrencyCode: "USD"
	    },
	    Reason: "Bonus for today's session of the month long research study."
	};
	console.log(data);
	if (actuallyPay) {
	    TurkServer.mturk("GrantBonus", data);
	    console.log('Paid.');
	}
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
	if (actuallyPay) {
	    console.log(paid + ' Turkers were paid.');
	} else {
	    console.log(paid + ' Turkers *would have been* paid.');
	}
    },
    revokeQual: function(workerId, qualId) {
	TurkServer.checkAdmin();
	TurkServer.mturk('RevokeQualification', 
    			 {SubjectId: workerId,
    			  QualificationTypeId: qualId,
			  Reason: "You have missed more than two sessions of the month-long research study, and will therefore not be able to participate any more."});
	Workers.update({_id: workerId},
		       {$pull: {quals: {id: qualId, value: 1}}});
	console.log('Revoked qual ' + qualId + ' for ' + workerId);
    },
    findRevoked: function() {
	console.log('findRevoked');
	var revoked = getRevoked();
	console.log(revoked);
    },
    grantQual: function(workerId, qualId) {
	TurkServer.checkAdmin();
	console.log('grantQual');
	TurkServer.Util.assignQualification(workerId, qualId, 1, false)
	console.log('Granted qual to: ' + workerId);
    },
    grantSurveyQuals: function(actuallyGrant) {
	TurkServer.checkAdmin();
	console.log('grantSurveyQuals');
	var revoked = getRevoked();
	console.log('Revoked: ' + revoked.length);
	var qualified = getSurveyQualified();
	console.log('Survey qualified: ' + qualified.length);
	var grant = _.difference(revoked, qualified);
	if (actuallyGrant) {
	    _.each(grant, function(workerId) {
		TurkServer.Util.assignQualification(workerId, Meteor.settings.QualSurvey, 1, false)
	    });
	    console.log('Granted quals to: ' + JSON.stringify(grant));
	} else {
	    console.log('Would grant quals to: ' + JSON.stringify(grant));
	}
    },
    surveyQualReminders: function() {
	console.log('surveyQualReminders');
	var batchId = Batches.findOne({name: 'exitsurvey'})._id;
	var qualified = getSurveyQualified();
	console.log('Survey qualified: ' + qualified.length);
	var assts = Assignments.find({batchId: batchId}).fetch();
	console.log('Survey completed: ' + assts.length);
	var completed = _.map(assts, function(asst) {return asst.workerId});
	var remind = _.difference(qualified, completed);
	console.log(JSON.stringify(remind));
    },
    getQualifiedWorkers: function(time) {
	var workers = getQualified(time);
	console.log(workers.length + ' workers have that qualification.');
    },
    emailPanel: function(emailId, time) {
	if (time == 'both') {
	    var workers = getQualified(1).concat(getQualified(3));
	} else {
	    var workers = getQualified(time);
	}
	var workerIds = _.map(workers, function(worker) {
	    return worker._id;
	});
	WorkerEmails.update({_id: emailId},
			    {$set: {recipients: workerIds}});
    },
    emailGroup: function(emailId, group) {
	WorkerEmails.update({_id: emailId},
			    {$set: {recipients: group}});
    },
    emailWorker: function(workerId, subject, msg) {
	WorkerEmails.insert({subject: subject,
			     message: msg,
			     recipients: [workerId]});
    },
    batchDiffs: function(batch1, batch2) {
	var batchId1 = Batches.findOne({name: batch1})._id;
	var batchId2 = Batches.findOne({name: batch2})._id;	
	var assts1 = Assignments.find({batchId: batchId1}).fetch();
	var assts2 = Assignments.find({batchId: batchId2}).fetch();
	var workerIds1 = _.map(assts1, function(asst) {return asst.workerId});
	var workerIds2 = _.map(assts2, function(asst) {return asst.workerId});
	var missing = _.difference(workerIds1, workerIds2);
	var qualMap = {};
	qualMap[Meteor.settings.Qual1PM] = '1PM';
	qualMap[Meteor.settings.Qual3PM] = '3PM';
	_.each(missing, function(workerId) {
	    var quals = Workers.findOne({_id: workerId}).quals;
	    if (quals.length == 1) {
		console.log('Already revoked qual for: ' + workerId);
	    } else {
		var qualId = Workers.findOne({_id: workerId}).quals[1].id;
		console.log(workerId + ': ' + qualMap[qualId]);
	    }
	});
    },
    participationHist: function() {
	var recruitingBatchId = Batches.findOne({name: 'recruiting'})._id;
	var batchMap = {};
	Batches.find().forEach(function(batch) {
	    batchMap[batch._id] = batch.name;
	});
	var workers = getQualified(1).concat(getQualified(3));
	var array = [];
	_.each(workers, function(worker) {
	    var workerId = worker._id;
	    var assignments = Assignments.find({workerId: workerId,
						batchId: {$ne: recruitingBatchId}},
					       {sort: {acceptTime: 1}}).fetch();
	    var totalGames = 0;
	    _.each(assignments, function(asst) {
		var instances = asst.instances || [];
		var instanceIds = _.map(instances, function(inst) {return inst.id});
		var count = Experiments.find({_id: {$in: instanceIds},
				              endReason: 'finished'}).count()
		totalGames += count;
	    });
	    array.push(totalGames);
	});
	console.log(array.length);
	console.log(JSON.stringify(array));
    },
    findSubmitFailure: function(exclude, actuallyFix) {
	console.log('findSubmitFailure');
	var workers = getQualified(1).concat(getQualified(3));
	var recruitingBatchId = Batches.findOne({name: 'recruiting'})._id;
	_.each(workers, function(worker) {
	    var workerId = worker._id;
	    if (_.indexOf(exclude, workerId) != -1) {return;}
	    var assignments = Assignments.find({workerId: workerId,
						batchId: {$ne: recruitingBatchId}}).fetch();
	    var totalGames = 0;
	    var gameLengths = [];
	    var totalBonus = 0;
	    _.each(assignments, function(asst) {
		var instances = asst.instances || [];
		totalGames += instances.length;
		gameLengths.push(instances.length);
		totalBonus += asst.bonusPayment;
	    });
	    var userGames = Meteor.users.findOne({workerId: workerId}).numGames;
	    var userBonus = Meteor.users.findOne({workerId: workerId}).bonus;
	    totalBonus = parseFloat(totalBonus.toFixed(2));
	    userBonus = parseFloat(userBonus.toFixed(2));
	    if (totalGames != userGames) {
		console.log(workerId)
		console.log('Total Games: ' + totalGames);
		console.log('User Games: ' + userGames);
		console.log('Total Bonus: ' + totalBonus);
		console.log('User Bonus: ' + userBonus);
		if (actuallyFix) {
		    Meteor.users.update({workerId: workerId},
					{$set: {numGames: totalGames,
						bonus: totalBonus}});
		    console.log('Fixed!')
		}
	    }
	});
    },
    findAbsences: function(numAbsences, session) {
	console.log('findAbsences');
	var recruitingBatchId = Batches.findOne({name: 'recruiting'})._id;
	var batchMap = {};
	Batches.find().forEach(function(batch) {
	    batchMap[batch._id] = batch.name;
	});
	var days = Batches.find({name: {$nin: ['pilot', 'recruiting', 'exitsurvey']}}).count();
	if (!session) {
	    var workers = getQualified(1).concat(getQualified(3));
	} else {
	    var workers = getQualified(session);
	}
	var absentees = [];
	_.each(workers, function(worker) {
	    var workerId = worker._id;
	    var assignments = Assignments.find({workerId: workerId,
						batchId: {$ne: recruitingBatchId}},
					       {sort: {acceptTime: 1}}).fetch();
	    var absences = days - assignments.length;
	    var workerGames = {};
	    var totalGames = 0;
	    _.each(assignments, function(asst) {
		var instances = asst.instances || [];
		var instanceIds = _.map(instances, function(inst) {return inst.id});
		var count = Experiments.find({_id: {$in: instanceIds},
				              endReason: 'finished'}).count()
		if (count < 5) { absences += 1; }
		workerGames[asst.batchId] = count;
		totalGames += count;
	    });
	    if (absences >= numAbsences) {
		console.log(worker._id);
		_.each(assignments, function(asst) {
		    console.log(batchMap[asst.batchId] + ': ' + workerGames[asst.batchId]);
		});
		console.log('Total: '+ totalGames);
		absentees.push(worker._id);
	    }
	});
	console.log(JSON.stringify(absentees));
    },
    migrateData: function() {
	console.log('Starting migration.');
	var recruitingBatchId = Batches.findOne({name: 'recruiting'})._id;
	Experiments.find({batchId: {$ne: recruitingBatchId}}).forEach(function(exp) {
	    var game = Games.direct.findOne({_groupId: exp._id});
	    Experiments.update({_id: exp._id}, {$set: {endReason: game.state}});
	});
	console.log('Done.')
    },
});

function getQualified(time) {
    var map = {1: Meteor.settings.Qual1PM,
	       3: Meteor.settings.Qual3PM};
    return Workers.find({
	quals: {$elemMatch: {id: map[time], value: 1}}
    }).fetch();
}

function getRevoked() {
    var original = WorkerEmails.findOne({_id: "NtDREvs8gkLt5AKGQ"}).recipients;
    var qualified = _.map(getQualified(1).concat(getQualified(3)), function(worker) {
	return worker._id;
    });
    return _.difference(original, qualified);
}

function getSurveyQualified() {
    var workers =  Workers.find({
	quals: {$elemMatch: {id: Meteor.settings.QualSurvey, value: 1}}
    }).fetch();
    return _.map(workers, function(worker) {
	return worker._id;
    });
}
