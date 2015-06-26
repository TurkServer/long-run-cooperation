Games = new Meteor.Collection('games');

Meteor.methods({
    remove_game: function(game_id) {
	return Games.remove(game_id);
    },
    match_players: function(pid1, pid2) {
	var state = {};
	var moves = {};
	var scores = {};
	state[pid1] = 'pending';
	state[pid2] = 'pending';
	moves[pid1] = [];
	moves[pid2] = [];
	scores[pid1] = [];
	scores[pid2] = [];
	var game_id = Games.insert({date: new Date(),
				    players: [pid1, pid2],
				    round: 1,
				    state: state,
				    moves: moves,
				    scores: scores,
				    status: 'playing'});
	Meteor.users.update({_id: pid1},
			    {$set: {state: 'game',
				    'game.game_id': game_id,
				    'game.opponent_id': pid2,
				    'game.score': 0,
				    'game.invited': false}});
	Meteor.users.update({_id: pid2},
			    {$set: {state: 'game',
				    'game.game_id': game_id,
				    'game.opponent_id': pid1,
				    'game.score': 0,
				    'game.invited': true}});

    },
    complete_move: function(game_id, pid, action) {
	var state_obj = {};
	state_obj['state.' + pid] = 'completed';
	var move_obj = {};
	move_obj['moves.' + pid] = action;
	Games.update({_id: game_id},
		     {$set: state_obj,
		      $push: move_obj});
	var game = Games.findOne(game_id);
	var pid1 = game.players[0];
	var pid2 = game.players[1];
	if (game.state[pid1] == 'completed' &&
	    game.state[pid2] == 'completed') {
	    Meteor.call('complete_round', game_id);
	}
    },
    complete_round: function(game_id) {
	var game = Games.findOne(game_id);
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
	var score_obj = {};
	score_obj['scores.' + pid1] = payoff[0];
	score_obj['scores.' + pid2] = payoff[1];
	var update =  {$inc: {round: 1},
		       $push: score_obj};
	if (round == 5) {
	    update['$set'] = {status: 'over'};
	    Meteor.users.update({_id: pid1},
				{$push: {games: game_id}});
	    Meteor.users.update({_id: pid2},
				{$push: {games: game_id}});
	} else {
	    var obj = {};
	    obj['state.' + pid1] = 'pending';
	    obj['state.' + pid2] = 'pending';
	    update['$set'] = obj;
	}
	Games.update({_id: game_id}, update);
	Meteor.users.update({_id: pid1},
			    {$inc: {'game.score': payoff[0]}});
	Meteor.users.update({_id: pid2},
			    {$inc: {'game.score': payoff[1]}});
    },
    end_game: function(pid, gid) {
	Meteor.users.update({_id: pid},
			    {$set: {state: 'lobby'}});
    },
    to_lobby: function() {
	Meteor.users.update({_id: Meteor.userId()},
			    {$set: {state: 'lobby'}});
    },
    abandon_game: function(game_id, pid, oid) {
	Meteor.users.update({_id: pid},
			    {$set: {state: 'lobby'}});
	Meteor.users.update({_id: oid},
			    {$set: {state: 'lobby'}});
	Games.update({_id: game_id},
		     {$set: {status: 'abandoned'}});
    }
});
