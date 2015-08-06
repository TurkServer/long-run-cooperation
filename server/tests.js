var abandonProb = 0.01;

Meteor.methods({
    'clearDB': function() {
	console.log('clearDB');
	Partitioner.directOperation(function() {
	    Meteor.users.remove({'username': {$ne: 'admin'}});
	    GameGroups.remove({});
	    Actions.remove({});
	    Rounds.remove({});
	    Games.remove({});
	    RoundTimers.remove({});
	    Experiments.remove({});
	    Assignments.remove({});
	});
    },
    'addUsers': function(numUsers) {
	console.log('addUsers: ' + numUsers);
	var batchId = Batches.findOne({name: 'pilot'})._id;
	addUsers(numUsers);
    },
    'testGame': function(clientTest) {
	var numUsers = Meteor.users.find({'username': {$ne: 'admin'}}).count();
	TurkServer.checkAdmin();
	console.log('testGame');
	var batchId = Batches.findOne({name: 'pilot'})._id;
	var batch = TurkServer.Batch.getBatch(batchId);
	Meteor.call('ts-admin-lobby-event', batchId, 'reset-lobby');
	Meteor.call('ts-admin-lobby-event', batchId, 'inc-day');
	var lobbyHandle = LobbyStatus.find({'status': true}).observe({
	    added: function(doc) {
		var number = LobbyStatus.find({'status': true}).count();
		if (number >= numUsers) {
		    testingFuncs.assignFunc(batch.assigner);
		    if (!clientTest) {
			game();
		    }
		}
	    }
	});
	if (!clientTest) {
	    var finishedHandle = Meteor.users.find({'turkserver.state': 'exitsurvey'}).observe({
		added: function(doc) {
		    number = Meteor.users.find({'turkserver.state': 'exitsurvey'}).count();
		    if (number == numUsers) {
			finishedHandle.stop();
			lobbyHandle.stop();
			Assignments.find({'status': 'assigned'}).forEach(function(asst) {
			    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
			    testingFuncs.submitHITInternal(asstObj.userId);
			    asstObj.setCompleted();
			});
			console.log('Done with testGame.')
		    }
		}
	    });
	    addAssignments(batchId);
	}
    },
    analyze: function(batchName) {
	console.log('Running tests ...');
	var batchId = Batches.findOne({name: batchName})._id;
	var instances = Experiments.find({batchId: batchId}).fetch();
	var assignments = Assignments.find({batchId: batchId}).fetch();
	console.log('Testing ' + instances.length + ' instances.');
	_.each(instances, function(instance) {
	    testInstance(instance);
	});
	console.log('Testing ' + assignments.length + ' assignments.');
	_.each(assignments, function(asst) {
	    testAsst(asst);
	});
	console.log('Done!');
    }
});

var game = function() {
    var gameGroup = GameGroups.findOne({}, {sort: {timestamp: -1}});
    var groupIds = gameGroup.instances;
    for (var j=0; j<groupIds.length; j++) {
	groupId = groupIds[j];
	Partitioner.bindGroup(groupId, function() {
	    var clientFunc = function(userId) {
		if (Math.random() > abandonProb) {
		    var choice = Math.random() < 0.5? 1 : 2;
		    testingFuncs.chooseActionInternal(userId, choice, currentRound());
		} else {
		    console.log('Someone is abandoning.');
		}
	    }
	    var users = Experiments.findOne({_id: groupId}).users;
	    var user1 = users[0];
	    var user2 = users[1];
	    var instance = TurkServer.Instance.getInstance(groupId);
	    var _groupId = groupId;
	    Meteor.defer(function() {
		Meteor.defer(function() { clientFunc(user1); });
		Meteor.defer(function() { clientFunc(user2); });
		var abandonedHandle = Games.find({state: 'abandoned'}).observe({
		    added: function(doc) {
			console.log('Abandoned game.');
			roundsStartHandle.stop();
			roundsEndHandle.stop();
			abandonedHandle.stop();
			instance.sendUserToLobby(user1);
			instance.sendUserToLobby(user2)
		    }
		});
		var roundsStartHandle = Rounds.find().observe({
		    added: function(doc) {
			Partitioner.bindGroup(_groupId, function() {
			    user1Action = Actions.findOne({userId: user1,
							   roundIndex: doc.index});
			    user2Action = Actions.findOne({userId: user2,
							   roundIndex: doc.index});
			    if (!user1Action) {
				Meteor.defer(function() { clientFunc(user1); });
			    }
			    if (!user2Action) {
				Meteor.defer(function() { clientFunc(user2); });
			    }
			});
		    }
		});
		var roundsEndHandle = Rounds.find({ended: true}).observe({
		    added: function(doc) {
			if (doc.index == numRounds) {
			    roundsEndHandle.stop();
			    roundsStartHandle.stop();
			    abandonedHandle.stop();
			    instance.sendUserToLobby(user1);
			    instance.sendUserToLobby(user2);
			    return;
			}
			// Partitioner.bindGroup(_groupId, function() {
			//     Meteor.defer(function() { clientFunc(user1); });
			//     Meteor.defer(function() { clientFunc(user2); });
			// });
		    }
		});
	    });
	});
    }
}

var testInstance = function(instance) {
    var groupId = instance._id;
    Partitioner.bindGroup(groupId, function() {
	var game = Games.findOne();
	warn(game.state == 'finished', 'Instance ' + groupId + ': ' + game.state);
	var rounds = Rounds.find({ended: true}).fetch();
	warn(rounds.length == numRounds, 'Instance ' + groupId + ': number of rounds: ' + rounds.length);
	var roundIndices = _.map(rounds, function(round) {
	    return round.index;
	});
	sort(roundIndices);
	warn(arraysEqual(roundIndices, _.range(1,rounds.length+1)), 'Instance ' + groupId + ': wrong round indices: ' + roundIndices)
	var users = instance.users;
	for (var i=0;i<2;i++) {
	    for (var k=1;k<=rounds.length;k++) {
		var actions = Actions.find({userId: users[i],
					    roundIndex: k}).fetch();
		warn(actions.length == 1, 'Instance ' + groupId + ': wrong action count (' + actions.length + '): ' + users[i] + ', round' + k);
	    }
	}
    });
}

var testAsst = function(asst) {
    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
    var userId = asstObj.userId;
    var instances = _.map(asst.instances, function(instance) {
	return instance.id;
    });
    var bonus = asst.bonusPayment;
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
    var newBonus = points*conversion;
    warn(bonus.toFixed(2) == newBonus.toFixed(2),
	 'Wrong bonus: ' + asst._id + ', ' + userId + ', ' + bonus.toFixed(2) + ', ' + newBonus.toFixed(2));
}


var addUsers = function (number) {
    for (var i=0; i<number; i++) {
	Accounts.insertUserDoc({}, {workerId: Random.id()});
    }
}

var addAssignments = function(batchId) {
    Meteor.users.find({'username': {$ne: 'admin'}}).forEach(function(user) {
	var asst = TurkServer.Assignment.createAssignment({
	    batchId: batchId,
	    hitId: Random.id(),
	    assignmentId: Random.id(),
	    workerId: user.workerId,
	    acceptTime: new Date(),
	    status: "assigned"
	});
	asst._enterLobby();
	LobbyStatus.update({_id: user._id}, {$set: {status: true}});
    });
}

function warn(condition, message) {
    if (!condition) {
	console.log(message);
    }
}

function assert(condition, failure) {
    if (!condition) {
	throw new Error(failure);
    }
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
	if (a[i] !== b[i]) return false;
    }
    return true;
}

function nearlyEqual(a, b) {
    var diff = Math.abs(a-b);
    return diff < 0.00001;
}

function sort(list) {
    list.sort(function(a,b) {return a-b});
}
