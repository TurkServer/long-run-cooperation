Template.wrapper.helpers({
    showStats: function() {
	var state = playerState();
	return (state == 'game' ||
		state == 'lobby');
    }
});

Template.main.helpers({
    active: function() {
	if (Meteor.loggingIn()) {
	    return 'loading';
	}
	if (Meteor.user()) {
	    return playerState();
	}
	return 'loggedout';
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
