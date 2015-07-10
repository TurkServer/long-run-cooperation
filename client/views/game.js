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
    round: function() {
	var round = TurkServer.currentRound();
	return round && round.index;
    },
    gameOver: function() {
	var round = TurkServer.currentRound();
	return round && round.index == numRounds + 1;
    },
    choseAction: function() {
	var round = TurkServer.currentRound();
	return round && 
	    Rounds.findOne({playerId: Meteor.userId(),
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
