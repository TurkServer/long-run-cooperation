results = function() {
    var rounds = [];
    Rounds.find().forEach(function(obj) {
	if ('payoff' in obj) {
	    var index = obj.roundIndex - 1;
	    if (index > rounds.length-1) {
		rounds.push({round_: index});
	    }
	    if (obj.playerId == Meteor.userId()) {
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

color = function(action) {
    return action == 1? 'green' : 'red';
}