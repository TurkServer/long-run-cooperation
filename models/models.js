Games = new Meteor.Collection('games');
TurkServer.partitionCollection(Games);

Meteor.methods({
    getMatched: function() {
	var count = readyPlayers().count();
	if (count == 0) {
	    Meteor.call('setState', 'lobby');
	    return;
	}
	var random = Math.floor(Math.random() * count);
	var opponent = Meteor.users.findOne(ready(),
					    {skip: random});
	Meteor.call('matchPlayers', pid(), opponent._id);
    },
    matchPlayers: function(pid1, pid2) {
	var state = {};
	var moves = {};
	var scores = {};
	var roundTimes = [];
	roundTimes.push(new Date());
	state[pid1] = 'pending';
	state[pid2] = 'pending';
	moves[pid1] = [];
	moves[pid2] = [];
	scores[pid1] = [];
	scores[pid2] = [];
	var game_id = Games.insert({start: new Date(),
				    players: [pid1, pid2],
				    round: 1,
				    state: state,
				    moves: moves,
				    scores: scores,
				    status: 'playing',
				    roundTimes: roundTimes});
	Meteor.users.update({_id: pid1},
			    {$set: {state: 'game',
				    'game.game_id': game_id,
				    'game.opponent_id': pid2,
				    'game.invited': false}});
	Meteor.users.update({_id: pid2},
			    {$set: {state: 'game',
				    'game.game_id': game_id,
				    'game.opponent_id': pid1,
				    'game.invited': false}});

    },
    completeMove: function(action) {
	var state_obj = {};
	state_obj['state.' + pid()] = 'completed';
	var move_obj = {};
	move_obj['moves.' + pid()] = action;
	Games.update({_id: gid()},
		     {$set: state_obj,
		      $push: move_obj});
	var game = Games.findOne(gid());
	var pid1 = game.players[0];
	var pid2 = game.players[1];
	if (game.state[pid1] == 'completed' &&
	    game.state[pid2] == 'completed') {
	    Meteor.call('completeRound');
	}
    },
    completeRound: function() {
	var game = Games.findOne(gid());
	var round = game.round;
	var pid1 = game.players[0];
	var pid2 = game.players[1];
	var choice1 = game.moves[pid1][round-1];
	var choice2 = game.moves[pid2][round-1];
	var payoffs_map = {'1': {'1': [payoffs.R, payoffs.R],
				 '2': [payoffs.S, payoffs.T]},
			   '2': {'1': [payoffs.T, payoffs.S],
				 '2': [payoffs.P, payoffs.P]}}
	var payoff = payoffs_map[choice1][choice2]
	var push_obj = {};
	push_obj['scores.' + pid1] = payoff[0];
	push_obj['scores.' + pid2] = payoff[1];
	push_obj['roundTimes'] = new Date();
	var update =  {$inc: {round: 1},
		       $push: push_obj};
	if (round == numRounds) {
	    update['$set'] = {status: 'over',
			      end: new Date()};
	    Meteor.users.update({_id: pid1},
				{$push: {games: gid()}});
	    Meteor.users.update({_id: pid2},
				{$push: {games: gid()}});
	} else {
	    var obj = {};
	    obj['state.' + pid1] = 'pending';
	    obj['state.' + pid2] = 'pending';
	    update['$set'] = obj;
	}
	Games.update({_id: gid()}, update);
	Meteor.users.update({_id: pid1},
			    {$inc: {score: payoff[0]}});
	Meteor.users.update({_id: pid2},
			    {$inc: {score: payoff[1]}});
    },
    completeHIT: function(state) {
	Meteor.users.update({_id: pid()},
			    {$set: {state: state,
				    submitted: true}});
    },
    abandonGame: function() {
	Games.update({_id: gid()},
		     {$set: {status: 'abandoned'}});
    },
    setState: function(state) {
	Meteor.users.update({_id: pid()},
			    {$set: {state: state}});

    },
    incQuiz: function() {
	Meteor.users.update({_id: Meteor.userId()},
			    {$inc: {quizAttempts: 1}});
    },
    passedQuiz: function() {
	Meteor.users.update({_id: Meteor.userId()},
			    {$set: {passedQuiz: 1}});

    }
});
