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
	var round = TurkServer.currentRound();
	if (TurkServer.instanceEnded()) {
	    return session && session.games;
	} else {
	    return session && session.games + 1;
	}
    },
    round: function() {
	var round = TurkServer.currentRound();
	return round && round.index;
    },
    gameOver: function() {
	return TurkServer.instanceEnded();
    },
    choseAction: function() {
	var round = TurkServer.currentRound();
	return round && 
	    Rounds.findOne({userId: Meteor.userId(),
			    roundIndex: round.index});
    },
    results: function() {
	return gameResults();
    },
    payoffs: function() {
	var r = gameResults();
	var object = {'you': 0, 
		      'opponent': 0};
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
