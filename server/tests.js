var sleep = Meteor.wrapAsync(function(time, cb) {
    return Meteor.setTimeout((function() {
	return cb(void 0);
    }), time);
});

Meteor.methods({
    'testAssigner': function() {
	TurkServer.checkAdmin();
	clearDB();
	console.log('testAssigner');
	var batchid = Batches.findOne({name: 'main'})._id;
	Meteor.call('ts-admin-lobby-event', batchId, 'reset-lobby');
	for (var i=0; i<11; i++) {
	    var asst = addTestUser(batchId);
	    asst._enterLobby();
	    LobbyStatus.update({_id: userId}, {$set: {status: true}});
	}
	for (var j=0; j<numGames; j++) {
	    Meteor.call('ts-admin-lobby-event', batchId, 'next-game');
	    var gameGroup = GameGroups.findOne({counter: j+1});
	    console.log('Number of users in lobby: ' + gameGroup.users.length);
	    console.log('Left out user: ' + gameGroup.leftOut);
	    Meteor.call('ts-admin-stop-all-experiments', batchid);
	    sleep(100);
	}
	Meteor.call('ts-admin-lobby-event', batchId, 'exit-survey');
	assert(GameGroups.find().count() == 20, 'Wrong number of GameGroups.');
	assert(LobbyStatus.find().count() == 0, 'People still in lobby.');
    },
    'testGame': function() {
	var numUsers = 10;
	TurkServer.checkAdmin();
	clearDB();
	console.log('testGame');
	var batchId = Batches.findOne({name: 'main'})._id;
	var batch = TurkServer.Batch.getBatch(batchId);
	Meteor.call('ts-admin-lobby-event', batchId, 'reset-lobby');
	var lobbyHandle = LobbyStatus.find().observe({
	    added: function(doc) {
		var number = LobbyStatus.find().count();
		if (number == numUsers) {
		    Meteor.call('ts-admin-lobby-event', batchId, 'next-game');
		    game();
		}
	    }
	});
	var finishedHandle = Sessions.find({games: numGames}).observe({
	    added: function(doc) {
		number = Sessions.find({games: numGames}).count();
		if (number == numUsers) {
		    finishedHandle.stop();
		    lobbyHandle.stop();
		    console.log('Done with testGame.')
		}
	    }
	});
	for (var i=0; i<numUsers; i++) {
	    var asst = addTestUser(batchId);
	    asst._enterLobby();
	    LobbyStatus.update({_id: userId}, {$set: {status: true}});
	}
    },
    analyze: function() {
	console.log('Running tests ...');
	gameGroups = GameGroups.find().fetch();
	assert(gameGroups.length == numGames, 'Wrong number of game groups.');
	var gameGroupIndices = _.map(gameGroups, function(gameGroup) {
	    return gameGroup.counter;
	});
	gameGroupIndices.sort(function(a,b) {return a-b});
	assert(arraysEqual(gameGroupIndices, _.range(1,numGames+1)), 'Wrong game group counters: ' + gameGroupIndices);
	Experiments.direct.find().forEach(function(instance) {
	    var groupId = instance._id;
	    Partitioner.bindGroup(groupId, function() {
		var rounds = Rounds.find().fetch();
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
			assert('payoff' in actions[0], 'No payoff in action: ' + users[i] + ', ' + k);
		    }
		}
	    });
	});
	Sessions.find().forEach(function(session) {
	    assert(session.games == numGames, 'Wrong game number in session.');
	    var bonus = session.bonus;
	    var points = 0;
	    Partitioner.directOperation(function() {
		Actions.find({'userId': session.userId}).forEach(function(action) {
		    points += action.payoff;
		});
	    });
	    assert(nearlyEqual(bonus, points*conversion), 'Wrong bonus: ' + session.userId);			    
	});
	console.log('Done!');
    },
});

var game = function() {
    var gameGroup = GameGroups.findOne({}, {sort: {counter: -1}});
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

var addTestUser = function (batchId) {
    workerId = Random.id();
    userId = Accounts.insertUserDoc({}, {workerId: workerId});
    asst = TurkServer.Assignment.createAssignment({
	batchId: batchId,
	hitId: Random.id(),
	assignmentId: Random.id(),
	workerId: workerId,
	acceptTime: new Date(),
	status: "assigned"
    });
    return asst;
}

var clearDB = function() {
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
