var allPlayerStats = function(sessions) {
    stats = {'games': 0, 'bonus': 0};
    sessions.forEach(function(obj) {
	stats['games'] += obj.games;
	stats['bonus'] += obj.bonus;
    });
    stats['bonus'] = stats['bonus'].toFixed(2);
    return stats;
}

Template.stats.helpers({
    todayStats: function() {
	stats = {};
	var session = Sessions.findOne({assignmentId: assignmentId()});
	if (!session) {return;}
	stats['games'] = session.games;
	stats['bonus'] = session.bonus.toFixed(2);
	return stats;
    },
    allStats: function() {
	var sessions = Sessions.find({userId: Meteor.userId()});
	return allPlayerStats(sessions);
    },
    playing: function() {
	return TurkServer.inExperiment();
    },
    numOpponentGames: function() {
	var opponent = Meteor.users.findOne({_id: {$ne: Meteor.userId()}});
	if (!opponent) {return;}
	var sessions = Sessions.find({userId: opponent._id});
	var stats = allPlayerStats(sessions);
	return stats['games'];
    },
});
