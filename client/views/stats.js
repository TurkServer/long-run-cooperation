Template.stats.helpers({
    stats: function() {
	var userId = Meteor.userId();
	var stats = {today: {games: 0,
			     bonus: 0},
		     all: {games: 0,
			   bonus: 0}};
	var asst = Assignments.findOne();
	var game = Experiments.findOne();
	if (!asst || !game) {return};
	var num = asst.instances.length;
	if (game.endReason) {
	    stats.today.games = num;
	} else {
	    stats.today.games = num - 1;
	}
	// bonus earned from games earlier today
	var bonus = asst.bonusPayment || 0;
	// calculate bonus earned from this game
	// but not if the game is over, because then it has already been added to asst
	if (!game.endReason) {
	    var payoff = 0;
	    var rounds = Rounds.find({ended: true}).forEach(function(round){
		payoff += round.results[userId].payoff;
	    });
	    bonus += payoff*conversion;
	}
	stats.today.bonus = bonus.toFixed(3);
	var user = Meteor.user();
	if ('numGames' in user && 'bonus' in user) {
	    stats.all.games = user.numGames + stats.today.games;
	    var bonus = parseFloat(stats.today.bonus) + user.bonus;
	    stats.all.bonus = bonus.toFixed(3);
	} else {
	    stats.all.games = stats.today.games;
	    stats.all.bonus = stats.today.bonus;
	}
	return stats;
    },
});
