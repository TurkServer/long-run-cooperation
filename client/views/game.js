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
    choseAction: function() {
	var round = TurkServer.currentRound();
	return round && 
	    Rounds.findOne({playerId: Meteor.userId(),
			    roundIndex: round.index});
    },
    showPrevious: function() {
	var round = TurkServer.currentRound();
	return round && round.index > 1;
    },
    results: function() {
	return results();
    },
    payoffs: function() {
	var r = results();
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
    "click button": function (e) {
	Meteor.call('chooseAction', parseInt(e.target.value),
		    TurkServer.currentRound().index);
    },
});
