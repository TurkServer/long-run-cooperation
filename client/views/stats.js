var allPlayerStats = function(sessions) {
    var stats = {games: 0, bonus: 0};
    sessions.forEach(function(obj) {
	stats.games += obj.games;
	stats.bonus += obj.bonus;
    });
    stats.bonus = stats.bonus.toFixed(2);
    return stats;
}

Template.stats.helpers({
    todayStats: function() {
	var asst = Assignments.findOne();
	var game = Games.findOne();
	if (!asst || !game) {return};
	var stats = {bonus: 0};
	var num = asst.instances.length;
	if (game.state == 'finished') {
	    stats.games = num;
	} else {
	    stats.games = num - 1;
	}
	if (asst.bonusPayment) {
	    stats.bonus = asst.bonusPayment.toFixed(2);
	}
	return stats;
	return {}
    },
    allStats: function() {
	var sessions = Sessions.find({userId: Meteor.userId()});
	return allPlayerStats(sessions);
    },
    playing: function() {
	return TurkServer.inExperiment();
    },
    numOpponentGames: function() {
	var sessions = Sessions.find({userId: oppId()});
	var stats = allPlayerStats(sessions);
	return stats.games;
    },
});
