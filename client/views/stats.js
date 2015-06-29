Template.stats.helpers({
    numGames: function() {
	var user = Meteor.user();
	return user && user.games && user.games.length;
    },
    meanScore: function() {
	var total = totalScore();
	return (total/allScores.length).toFixed(2);
    },
    totalScore: function() {
	return totalScore();
    },
    bonus: function() {
	var total = totalScore();
	return (total*0.003).toFixed(2);
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
