pid = function() {
    var u = Meteor.user();
    return u && u._id;
};

oid = function() {    
    var p = player();
    return p && p.game.opponent_id;
};

gid = function() {
    var p = player();
    return p && p.game.game_id;
};

frozen = function() {
    var users = Meteor.users.find();
    if (users.count() < numPlayers) {
	return false;
    };
    var opponents = Meteor.users.find({_id: {$ne: pid()},
				       "status.online": true,
				       state: {$ne: 'abandoned'},
				       submitted: false});
    return opponents.count() == 0;
};

online = function() {
    return {_id: {$ne: pid()},
	    "status.online": true,
	    state: 'lobby',
	    treatment: Meteor.user().treatment};
};

players = function() {
    return Meteor.user() && Meteor.users.find(online());
};

player = function() {
    return Meteor.user();
};

opponent = function() {
    var p = player();
    return p && Meteor.users.findOne(p.game.opponent_id);
};

game = function() {
    var p = player();
    return p && Games.findOne(p.game.game_id);
};

playerState = function() {
    var p = player();
    return p && p.state;
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
