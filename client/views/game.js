color = function(action) {
    return action == 1? 'green' : 'red';
}

gameResults = function() {
    return rounds;
}

Template.game.helpers({
    loading: function() {
	return !currentRound();
    },
    gameNum: function() {
	var asst = Assignments.findOne();
	var game = Games.find();
	if (!asst || !game) {return;}
	var num = asst.instances.length;
	if (game.state == 'finished')
	    return num - 1;
	else {
	    return num;
	}
	return;
    },
    round: function() {
	return currentRound();
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
	Meteor.call('chooseAction', parseInt(e.target.value), currentRound());
    },
    "click .endgame": function() {
	Meteor.call('goToLobby');
    }
});
