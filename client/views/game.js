Template.game.helpers({
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
	var session = Sessions.findOne({userId: Meteor.userId(),
					day: today()});
	var game = Games.findOne();
	if (game && game.state == 'finished') {
	    return session && session.games;
	} else {
	    return session && session.games + 1;
	}
    },
    round: function() {
	var game = Games.findOne();
	if (!game) {return 1};
	return game.round;
    },
    gameOver: function() {
	var game = Games.findOne();
	return game && game.state == 'finished';
    },
    gameAbandoned: function() {
	var game = Games.findOne();
	return game && game.state == 'abandoned';
    },
    choseAction: function() {
	var game = Games.findOne();
	if (!game) {return};
	return Rounds.findOne({userId: Meteor.userId(),
			       roundIndex: game.round});
    },
    waiting: function() {
	var game = Games.findOne();
	if (!game) {return};
	var rounds = Rounds.find({roundIndex: game.round});
	return rounds.count() == 2;
    },
    results: function() {
	return gameResults();
    },
    payoffs: function() {
	var r = gameResults();
	var object = {'you': 0, 
		      'opponent': 0};
	if (!r) {return object;}
	for (var i=0; i<r.length; i++) {
	    var round = r[i];
	    object['you'] += round['pscore'];
	    object['opponent'] += round['oscore'];
	}
	return object;
    }
});

Template.game.events({
    "click .action": function(e) {
	Meteor.call('chooseAction', parseInt(e.target.value),
		    TurkServer.currentRound().index);
    },
    "click .endgame": function() {
	Meteor.call('goToLobby');
    }
});
