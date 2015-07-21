color = function(action) {
    return action == 1? 'green' : 'red';
}

gameResults = function() {
    var game = Games.findOne();
    if (!game) {return;}
    var round = currentRound();
    var finished = game.state == 'finished';
    var rounds = [];
    Actions.find({}, {sort: {roundIndex: 1}}).forEach(function(obj) {
	if ((obj.roundIndex < round) || finished) {
	    var index = obj.roundIndex - 1;
	    if (index > rounds.length-1) {
		rounds.push({round_: index + 1});
	    }
	    if (obj.userId == Meteor.userId()) {
		rounds[index]['pchoice'] = obj.action;
		rounds[index]['pcolor'] = color(obj.action);
		rounds[index]['pscore'] = obj.payoff;
	    } else {
		rounds[index]['ochoice'] = obj.action;		    
		rounds[index]['ocolor'] = color(obj.action);
		rounds[index]['oscore'] = obj.payoff;
	    }
	}
    });
    return rounds;
}

Template.game.helpers({
    gameNum: function() {
	var session = Sessions.findOne({assignmentId: assignmentId()});
	var game = Games.findOne();
	if (game && game.state == 'finished') {
	    return session && session.games;
	} else {
	    return session && session.games + 1;
	}
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
	Meteor.call('chooseAction', parseInt(e.target.value));
    },
    "click .endgame": function() {
	Meteor.call('goToLobby');
    }
});
