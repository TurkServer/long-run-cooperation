Template.stats.helpers({
    stats: function() {
	var stats = {today: {games: 0,
			     bonus: 0},
		     all: {games: 0,
			   bonus: 0},
		     opponent: {games: 0}};
	var asst = Assignments.findOne();
	var game = Games.findOne();
	if (!asst || !game) {return};
	var num = asst.instances.length;
	if (game.state == 'finished') {
	    stats.today.games = num;
	} else {
	    stats.today.games = num - 1;
	}
	if (asst.bonusPayment) {
	    stats.today.bonus = asst.bonusPayment.toFixed(2);
	}
	var user = Meteor.user();
	if ('numGames' in user && 'bonus' in user) {
	    stats.all.games = user.numGames + stats.today.games;
	    var bonus = parseFloat(stats.today.bonus) + user.bonus;
	    stats.all.bonus = bonus.toFixed(2);
	} else {
	    stats.all.games = stats.today.games;
	    stats.all.bonus = stats.today.bonus;
	}
	var opponent;
	Meteor.users.find().forEach(function(user) {
	    if (user._id != Meteor.userId()) {
		opponent = user;
	    }
	});
	if (opponent) {
	    if ('numGames' in opponent) {
		stats.opponent.games = opponent.numGames + stats.today.games;
	    } else {
		stats.opponent.games = stats.today.games;
	    }
	} else {
	    stats.opponent.games = null;
	}
	return stats;
    },
    opponent: function() {
	return Meteor.users.find().count() == 2;
    }
});
