Template.stats.helpers({
    numGames: function() {
	var user = Meteor.user();
	return user && user.games && user.games.length;
    },
    totalScore: function() {
	return Meteor.user().score;
    },
    bonus: function() {
	var total = Meteor.user().score;
	return (total*0.0025).toFixed(2);
    },
    playing: function() {
	var user = Meteor.user();
	return user && user.state == 'game';
    },
    numOpponentGames: function() {
	var o = opponent();
	return o && o.games.length;
    },
});
