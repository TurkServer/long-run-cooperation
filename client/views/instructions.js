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
    "click .quiz": function () {
	Meteor.call('setState', 'quiz');
    },
});
