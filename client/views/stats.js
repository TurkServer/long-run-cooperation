Template.stats.helpers({
    todayStats: function() {
	stats = {};
	var session = Sessions.findOne({userId: Meteor.userId(),
					day: today()});
	stats['games'] = session.games;
	stats['bonus'] = session.bonus.toFixed(2);
	return stats;
    },
    allStats: function() {
	stats = {'games': 0, 'bonus': 0};
	var sessions = Sessions.find({userId: Meteor.userId()});
	sessions.forEach(function(obj) {
	    stats['games'] += obj.games;
	    stats['bonus'] += obj.bonus;
	});
	stats['bonus'] = stats['bonus'].toFixed(2);
	return stats;
    },
    playing: function() {
	return TurkServer.inExperiment();
    },
    numOpponentGames: function() {
	return
    },
});
