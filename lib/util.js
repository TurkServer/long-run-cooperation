pid = function() {
    var u = Meteor.user();
    return u && u._id;
};

oid = function() {    
    var u = Meteor.user();
    return u && u.game.opponent_id;
};

gid = function() {
    var u = Meteor.user();
    return u && u.game.game_id;
};

ready = function() {
    return {_id: {$ne: pid()},
	    "status.online": true,
	    state: 'lobby'};
};

available = function() {
    return {_id: {$ne: pid()},
	    "status.online": true,
	    state: {$nin: ['abandoned', 'idle']}};
};

frozen = function() {
    var users = Meteor.users.find();
    if (users.count() < numPlayers) {
	return false;
    };
    var opponents = Meteor.users.find(available());
    return opponents.count() == 0;
};

readyPlayers = function() {
    return Meteor.user() && Meteor.users.find(ready());
};

opponent = function() {
    var u = Meteor.user();
    return u && Meteor.users.findOne(u.game.opponent_id);
};

game = function() {
    var u = Meteor.user();
    return u && Games.findOne(u.game.game_id);
};

playerState = function() {
    var u = Meteor.user();
    return u && u.state;
};

nextOpponent = function() {
    var u = Meteor.user();
    if (!u) { return; }
    var numGames = u.games.length;
    var number = u.number - 1;
    var order = globalOrder[u.number-1][numGames];
    return order;
};

gameResults = function() {
    var g = game();
    if (!g) { return; }
    var p_id = pid();
    var o_id = oid();
    var oname = opponent().username;
    var objects = [];
    var colors = {'1': 'green',
		  '2': 'red'}
    for (i=2; i<=g.round; i++) {
	pchoice = g.moves[p_id][i-2];
	ochoice = g.moves[o_id][i-2];
	pscore = g.scores[p_id][i-2];
	oscore = g.scores[o_id][i-2];
	var object = {'round_': i-1,
		      'pchoice': pchoice,
		      'pscore': pscore,
		      'pchoice_color': colors[pchoice],
		      'oname': oname,
		      'ochoice': ochoice,
		      'oscore': oscore,
		      'ochoice_color': colors[ochoice]};
	objects.push(object);
    }
    return objects;
}

sum = function(array) {
    var total = 0;
    for (var i=0; i<array.length; i++) {
	total += array[i];
    }
    return total;
}

format_date = function(date) {
    return moment(date).format("MMMM Do YYYY");
};
