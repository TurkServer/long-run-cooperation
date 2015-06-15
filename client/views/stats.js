Template.stats.helpers({
    num_games: function() {
	var user = Meteor.user();
	return user && user.games.length;
    },
    games: function() {
	var user = Meteor.user();
	if (!user) {
	    return;
	}
	var games = user.games;
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
		return moment(date).format("dddd, MMMM Do YYYY, h:mm:ss a");
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
});
