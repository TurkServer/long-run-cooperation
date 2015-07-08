Template.wrapper.helpers({
    showStats: function() {
	var state = playerState();
	return (state == 'game' ||
		state == 'lobby');
    }
});

Template.main.helpers({
    active: function() {
	if (TurkServer.inExperiment()) {
	    return 'game';
	}
    }
});

Template.abandoned.events({
    "click .next": function () {
	Meteor.call('getMatched');
    },
});

Template.idle.events({
    "click .next": function () {
	if (Meteor.user().passedQuiz) {
	    Meteor.call('getMatched');
	} else {
	    Meteor.call('setState', 'instructions');
	}
    },
});
