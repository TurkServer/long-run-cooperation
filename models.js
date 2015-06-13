Games = new Meteor.Collection('games');
// { players: [player_id], state: 'pending'}
// state is one of: 'pending', 'playing', 'completed'

Players = new Meteor.Collection('players');
// { name: 'matt', state: 'lobby', idle: false, keepalive: 010203003302}
// state is one of: 'lobby', 'waiting', 'playing', 'completed'

Meteor.methods({
    remove_game: function (game_id) {
	return Games.remove(game_id);
    },
    get_player: function (player_name) {
	var exists = Players.findOne({name: player_name});
	if (exists) {
	    Meteor.call('keepalive', exists._id);
	    return exists._id;
	} else {
	    var player = {name: player_name, 
			  online: true, 
			  state: 'lobby',
                          last_keepalive: (new Date()).getTime()};
	}
	return Players.insert(player);
    },
    get_opponent: function () {
	var num_others = Players.find().count();
	var random = Math.floor(Math.random() * (num_others));
	var opponent = Players.findOne({}, {skip: random});
	console.log(opponent);
	return opponent._id;
    },
    keepalive: function (player_id) {
	Players.update({_id: player_id},
		       {$set: {last_keepalive: (new Date()).getTime(),
			       online: true}});
    }
});