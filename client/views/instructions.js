Template.instructions.helpers({
    'numgames': function() {
	return numgames;
    },
    'numrounds': function() {
	return numrounds;
    },
    'payoffs': function() {
	return payoffs;
    }
});

Template.instructions.events({
    "click .lobby": function () {
	Meteor.call('to_lobby');
    },
});
