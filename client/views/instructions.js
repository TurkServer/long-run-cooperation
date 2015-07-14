Template.instructions.helpers({
    'numGames': function() {
	return numGames;
    },
    'numRounds': function() {
	return numRounds;
    },
    'roundWait': function() {
	return roundWait;
    },
    'payoffs': function() {
	return payoffs;
    }
});

Template.instructions.events({
    "submit .consent": function (e, tmpl) {
	e.preventDefault();
	var checked = tmpl.find("input[name=agree]").checked;
	if (!checked) {
	    alert('Please accept the terms before continuing.');
	} else {
	    Router.go('/quiz');
	}
    },
});
