Template.stats.helpers({
    numGames: function() {
	var user = Meteor.user();
	return user && user.games && user.games.length;
    },
    meanScore: function() {
	var allGames = playerGames();
	if (!allGames) {
	    return;
	}
	var allScores = [];
	for (var i=0; i<allGames.length; i++) {
	    allScores.push(allGames[i].score);
	}
	return (sum(allScores)/allScores.length).toFixed(2);
    },
    playing: function() {
	var user = Meteor.user();
	return user && user.state == 'game';
    },
    numOpponentGames: function() {
	var o = opponent();
	return o && o.games.length;
    },
    games: function() {
	return playerGames();
    }
});
