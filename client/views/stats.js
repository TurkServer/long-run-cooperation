Template.stats.helpers({
    todayStats: function() {
	var asst = Assignments.findOne();
	var game = Games.findOne();
	if (!asst || !game) {return};
	var stats = {bonus: 0};
	var num = asst.instances.length;
	if (game.state == 'finished') {
	    stats.games = num;
	} else {
	    stats.games = num - 1;
	}
	if (asst.bonusPayment) {
	    stats.bonus = asst.bonusPayment.toFixed(2);
	}
	return stats;
    },
});
