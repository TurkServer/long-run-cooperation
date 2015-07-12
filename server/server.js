Meteor.publish('users', function() {
    return Meteor.users.find();
});

Meteor.publish('rounds', function() {
    return Rounds.find();
});

Meteor.publish('games', function() {
    return Games.find();
});

Meteor.publish('players', function() {
    return Players.find({userId: this.userId});
});

Meteor.publish('sessions', function() {
    return Sessions.find({userId: this.userId});
});

Meteor.startup(function () {
    Sessions._ensureIndex({day: 1, userId: 1});
    Rounds._ensureIndex({roundIndex: 1, userId: 1});
    Batches.upsert({name: 'testing'}, {name: 'testing', active: true});
    var batchid = Batches.findOne({name: 'testing'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.PairAssigner);
});

TurkServer.initialize(function() {
    Meteor.call('initGame');
});

TurkServer.Timers.onRoundEnd(function() {
    var game = Games.findOne();
    if (game.state != 'finished') {
	var inst = TurkServer.Instance.currentInstance();
	Games.update({groupId: inst._id}, {$set: {state: 'abandoned'}});
	TurkServer.Instance.currentInstance().teardown(false);
    }
});

Meteor.methods({
    initGame: function() {
	var gameId = Games.insert({round: 1,
				   state: 'active'});
	var updated = Players.update({userId: Meteor.userId()},
				     {$set: {gameId: gameId}});
	Meteor.call('startTimer');
    },
    startTimer: function() {
	var start = new Date();
	var end = new Date(start.getTime() + 10000);
	TurkServer.Timers.startNewRound(start, end);
    },
    goToLobby: function() {
	var inst = TurkServer.Instance.currentInstance();
	inst.sendUserToLobby(Meteor.userId());
    },
    endGame: function() {
	TurkServer.Instance.currentInstance().teardown(false);
    }
});
