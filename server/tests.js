var sleep = Meteor.wrapAsync(function(time, cb) {
    return Meteor.setTimeout((function() {
	return cb(void 0);
    }), time);
});

Meteor.methods({
    'clearDB': function() {
	console.log('clearDB');
	Partitioner.directOperation(function() {
	    Meteor.users.remove({'username': {$ne: 'admin'}});
	    GameGroups.remove({});
	    Actions.remove({});
	    Rounds.remove({});
	    Games.remove({});
	    Sessions.remove({});
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
    'testAssigner': function() {
	var numUsers = 11;
	TurkServer.checkAdmin();
	console.log('testAssigner');
	var batchId = Batches.findOne({name: 'pilot'})._id;
	Meteor.call('ts-admin-lobby-event', batchId, 'reset-lobby');
	addUsers(numUsers);
	addAssignments(batchId);
	for (var j=0; j<numGames; j++) {
	    Meteor.call('ts-admin-lobby-event', batchId, 'next-game');
	    var gameGroup = GameGroups.findOne({counter: j+1});
	    console.log('Number of users in lobby: ' + gameGroup.users.length);
	    console.log('Left out user: ' + gameGroup.leftOut);
	    Meteor.call('ts-admin-stop-all-experiments', batchId);
	    sleep(100);
	}
	Meteor.call('ts-admin-lobby-event', batchId, 'exit-survey');
	assert(GameGroups.find().count() == numGames, 'Wrong number of GameGroups.');
	assert(LobbyStatus.find().count() == 0, 'People still in lobby.');
    },
    'testGame': function() {
	var numUsers = Meteor.users.find({'username': {$ne: 'admin'}}).count();
	TurkServer.checkAdmin();
	console.log('testGame');
	var batchId = Batches.findOne({name: 'pilot'})._id;
	var batch = TurkServer.Batch.getBatch(batchId);
	Meteor.call('ts-admin-lobby-event', batchId, 'reset-lobby');
	var lobbyHandle = LobbyStatus.find({'status': true}).observe({
	    added: function(doc) {
		var number = LobbyStatus.find({'status': true}).count();
		if (number == numUsers) {
		    testingFuncs.assignFunc(batch.assigner);
		    //Meteor.call('ts-admin-lobby-event', batchId, 'next-game');
		    game();
		}
	    }
	});
	var finishedHandle = Meteor.users.find({'turkserver.state': 'exitsurvey'}).observe({
	    added: function(doc) {
		number = Meteor.users.find({'turkserver.state': 'exitsurvey'}).count();
		if (number == numUsers) {
		    finishedHandle.stop();
		    lobbyHandle.stop();
		    Assignments.find({'status': 'assigned'}).forEach(function(asst) {
			var asstObj = TurkServer.Assignment.getAssignment(asst._id);
			asstObj.setCompleted();
		    });
		    console.log('Done with testGame.')
		}
	    }
	});
	addAssignments(batchId);
    },
    analyze: function() {
	console.log('Running tests ...');
	var numUsers = Meteor.users.find({'username': {$ne: 'admin'}}).count();
	var games = GameGroups.find({}, {sort: {timestamp: 1}}).fetch();
	var assignments = Assignments.find({}, {sort: {timestamp: 1}}).fetch();
	var gameGroups = _.groupBy(games, function(element, index) {return Math.floor(index/numGames)});
	var assignGroups = _.groupBy(assignments, function(element, index) {return Math.floor(index/numUsers)});
	assert(gameGroups.length == assignGroups.length, 'gameGroups and assignGroups disagree on number of days: ' + gameGroups.length + ', ' + assignGroups.length);
	for (var key in gameGroups) {
	    console.log('Analyzing day: ' + key)
	    analyzeWrapper(gameGroups[key], assignGroups[key])
	}
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
		var choice = Math.random() < 0.5? 1 : 2;
		testingFuncs.chooseActionInternal(userId, choice);
	    }
	    var users = Experiments.findOne({_id: groupId}).users;
	    var user1 = users[0];
	    var user2 = users[1];
	    var instance = TurkServer.Instance.getInstance(groupId);
	    var _groupId = groupId;
	    Meteor.defer(function() {
		Meteor.defer(function() { clientFunc(user1); });
		Meteor.defer(function() { clientFunc(user2); });
		var roundsHandle = Rounds.find({ended: true}).observe({
		    added: function(doc) {
			if (doc.index == numRounds) {
			    roundsHandle.stop();
			    instance.sendUserToLobby(user1);
			    instance.sendUserToLobby(user2);
			    return;
			}
			Partitioner.bindGroup(_groupId, function() {
			    Meteor.defer(function() { clientFunc(user1); });
			    Meteor.defer(function() { clientFunc(user2); });
			});
		    }
		});
	    });
	});
    }
}

var analyzeWrapper = function(gameGroups, assignments) {
    var numUsers = assignments.length;
    var instances = _.map(gameGroups, function(group) {
	return group.instances;
    });
    instances = _.flatten(instances);
    assert(instances.length == (numGames*(numUsers/2)), 'Wrong number of instances: ' + instances.length);
    _.each(instances, function(instance) {
	testInstance(instance);
    });
    _.each(assignments, function(asst) {
	testAsst(asst);
    });
}

var testInstance = function(groupId) {
    var instance = Experiments.findOne({_id: groupId});
    Partitioner.bindGroup(groupId, function() {
	var rounds = Rounds.find({ended: true}).fetch();
	assert(rounds.length == numRounds, 'Wrong number of rounds.');
	var roundIndices = _.map(rounds, function(round) {
	    return round.index;
	});
	roundIndices.sort(function(a,b) {return a-b});
	assert(arraysEqual(roundIndices, _.range(1,11)), 'Wrong round indices: ' + roundIndices)
	var game = Games.findOne();
	assert(game.state == 'finished', 'Game is not finished.');
	var users = instance.users;
	for (var i=0;i<2;i++) {
	    for (var k=1;k<=numRounds;k++) {
		var actions = Actions.find({userId: users[i],
					    roundIndex: k}).fetch();
		assert(actions.length == 1, 'Wrong action count: ' + users[i] + ', ' + k);
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
	    points += round.results[userId].payoff;
	});
    }); 
    assert(nearlyEqual(bonus, points*conversion), 'Wrong bonus: ' + userId + ', ' + bonus + ', ' + points*conversion);			    
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
