today = function() {
    return moment().format('MM-DD-YYYY');
}

treatment = function() {
   var batch = TurkServer.batch();
    if (!batch) {return;}
    return batch.treatments;
}

oppId = function() {
    var inst = Experiments.findOne();
    if (!inst) {return;}
    var users = inst.users;
    var opponentId = _.filter(users, function(userId) {
	return userId != Meteor.userId();
    });
    if (!opponentId) {return;}
    else {return opponentId[0];}
}

assignmentId = function() {
    var asst = Assignments.findOne();
    return asst && asst.assignmentId;
}

batchId = function() {
    return TurkServer.batch()._id;
}

gameResults = function() {
    var game = Games.findOne();
    if (!game) {return;}
    var round = game.round;
    var finished = game.state == 'finished';
    var rounds = [];
    Rounds.find().forEach(function(obj) {
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

color = function(action) {
    return action == 1? 'green' : 'red';
}
