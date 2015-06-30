Template.game.helpers({
    timeSpent: function() {
	var g = game();
	if (!g) { return; }
	var round_times = g.round_times;
	var start = g.roundTimes[g.roundTimes.length - 1];
	var now = new Date();
	var diff = Chronos.liveMoment(now).diff(start, 'seconds');
	if (diff >= roundWait) {
	    Meteor.call('abandonGame');
	    if (g.state[pid()] == 'pending') {
		Meteor.call('setState', 'abandoned');
	    } else {
		Meteor.call('setState', 'lobby');
	    }
	}
	return diff;
    },
    roundWait: function() {
	return roundWait;
    },
    numGames: function() {
	return numGames;
    },
    numRounds: function() {
	return numRounds;
    },
    gameNum: function() {
	var user = Meteor.user();
	var g = game();
	if (!user || !g || !user.games) {return;}
	var number = user.games.length;
	if (g.status != 'over') {
	    number += 1;
	}
	return number;
    },
    done: function() {
	var u = Meteor.user();
	return u && u.games && u.games.length == numGames;
    },
    invited: function() {
	var u = Meteor.user();
	return u && u.game.invited;
    },
    round: function() {
	var g = game();
	return g && game().round;
    },
    showPrevious: function() {
	var g = game();
	return g && game().round > 1;   
    },
    pending: function() {
	var g = game();
	return g && g.state[pid()] == 'pending';
    },
    turnOver: function() {
	var g = game();
	return g && g.state[pid()] == 'completed';
    },
    playing: function() {
	var g = game();
	return g && g.status != 'over';
    },
    results: function() {
	return gameResults();
    },
    payoffs: function() {
	var results = gameResults();
	var object = {'you': 0,
		      'opponent': 0};
	for (i=0; i<results.length; i++) {
	    var round = results[i];
	    object['you'] += round['pscore'];
	    object['opponent'] += round['oscore'];
	}
	return object;
    },
});

Template.game.events({
    "click .cooperate": function () {
	Meteor.call('completeMove', '1');	
    },
    "click .defect": function () {
	Meteor.call('completeMove', '2');
    },
    "click .return": function () {
	Meteor.call('setState', 'lobby');
    },
});
