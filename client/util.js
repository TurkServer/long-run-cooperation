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

online = function() {
    return {_id: {$ne: pid()},
	    "status.online": true,
	    state: 'lobby',
	    treatment: Meteor.user().treatment};
};

players = function() {
    return Meteor.users.find(online());
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
    return p.state;
};

playerGames = function() {
    var user = Meteor.user();
    if (!user) {
	return;
    }
    var games = user.games;
    if (!games) {
	return;
    }
    objects = [];
    for (i=0; i<games.length; i++) {
	var game = Games.findOne(games[i]);
	if (!game) {
	    return;
	}
	var players = game.players;
	var name1 = Meteor.users.findOne(players[0]).username;
	var name2 = Meteor.users.findOne(players[1]).username;
	var score1 = sum(game.scores[players[0]])
	var score2 = sum(game.scores[players[1]])
	var format_date = function(date) {
	    //return moment(date).format("dddd, MMMM Do YYYY, h:mm:ss a");
	    return moment(date).format("MMMM Do YYYY");
	};
	if (name1 == user.username) {
	    var object = {date: format_date(game.date),
			  opponent: name2,
			  score: score1};
	} else {
	    var object = {date: format_date(game.date),
			  opponent: name1,
			  score: score2};
	}
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

