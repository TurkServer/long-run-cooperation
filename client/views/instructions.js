Template.instructions.helpers({
    'numGames': function() {
	return numGames;
    },
    'numRounds': function() {
	return numRounds;
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
