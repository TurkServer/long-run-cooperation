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
				       "status.online": true});
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

playerGames = function() {
    var user = Meteor.user();
    var games = user.games;
    if (!user || !games) { return; }
    objects = [];
    for (i=0; i<games.length; i++) {
	var game = Games.findOne(games[i]);
	if (!game) { return; }
	var players = game.players;
	var name1 = Meteor.users.findOne(players[0]).username;
	var name2 = Meteor.users.findOne(players[1]).username;
	var score1 = sum(game.scores[players[0]])
	var score2 = sum(game.scores[players[1]])
	var object = {date: format_date(game.date)};
	if (name1 == user.username) {
	    object[opponent] = name2;
	    object[score] = score1;
	} else {
	    object[opponent] = name1,
	    object[score] = score2;
	}
	objects.push(object);
    }
    return objects;
}

totalScore = function() {
    var allGames = playerGames();
    if (!allGames) { return; }
    var allScores = [];
    for (var i=0; i<allGames.length; i++) {
	allScores.push(allGames[i].score);
    }
    return sum(allScores);
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
