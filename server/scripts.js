Meteor.methods({
    'recalculateBonuses': function(setBonus) {
	TurkServer.checkAdmin();
	console.log('recalculateBonuses');
	Assignments.find().forEach(function(asst) {
	    console.log('Old bonus: ' + asst.bonusPayment);
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    var userId = asstObj.userId;
	    var points = 0;
	    Partitioner.directOperation(function() {
		Actions.find({'userId': userId}).forEach(function(action) {
		    points += action.payoff;
		});
	    });
	    var bonus = points*conversion;
	    console.log('New bonus: ' + bonus);
	    if (setBonus) {
		asstObj.setPayment(parseFloat(bonus.toFixed(2)));
	    }
	});
    },
    'payBonuses': function() {
	TurkServer.checkAdmin();
	console.log('payBonuses');
	Assignments.find({
	    "bonusPayment": {$gt: 0},
	    "bonusPaid": {$exists: false},
	    "status": "completed"
	}).forEach(function(asst) {
	    var asstObj = TurkServer.Assignment.getAssignment(asst._id);
	    asstObj.payBonus('Bonus for the decision-making HIT.');
	});
    },
});
