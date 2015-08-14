color = function(action) {
    return action == 1? 'green' : 'red';
}

gameResults = function() {
    return rounds;
}

Template.game.helpers({
    gameRemainingTime: function() {
	var elapsedTime = TurkServer.Timers.elapsedTime();
	var limit = 1.75*60000;
	var diff = Math.max(0, limit - elapsedTime)
	return TurkServer.Util.formatMillis(diff);
    },
    loading: function() {
	return !currentRound();
    },
    gameNum: function() {
	var asst = Assignments.findOne();
	return asst && asst.instances.length;
    },
    round: function() {
	return currentRound();
    },
    gameOver: function() {
	var game = Experiments.findOne();
	return game && game.endReason == 'finished';
    },
    gameAbandoned: function() {
	var game = Experiments.findOne();
	return game && ((game.endReason == 'abandoned') || (game.endReason == 'torndown'));
    },
    choseAction: function() {
	return Actions.findOne({userId: Meteor.userId(),
				roundIndex: currentRound()});
    },
    results: function() {
	var rounds = [];
	var payoffs = {you: 0, 
		       opponent: 0};
	Rounds.find({ended: true}, {sort: {index: 1}})
	    .forEach(function(obj) {
		var round = {round_: obj.index};
		var results = obj.results;
		for (var user in results) {
		    if (user == Meteor.userId()) {
			round.pchoice = results[user].action;
			round.pcolor = color(results[user].action);
			round.pscore = results[user].payoff;
			payoffs.you += results[user].payoff;
		    } else {
			round.ochoice = results[user].action;
			round.ocolor = color(results[user].action);
			round.oscore = results[user].payoff;
			payoffs.opponent += results[user].payoff;
		    }
		}
		rounds.push(round);
	    });
	return {rounds: rounds,
		payoffs: payoffs};
    }
});

Template.game.events({
    "click .action": function(e) {
	var target = e.target || e.srcElement;
	Meteor.call('chooseAction', parseInt(target.value), currentRound());
    },
    "click .endgame": _.debounce(function(e) {
	Meteor.call('goToLobby');
    }, 1000, true)
});
