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

Template.abandoned.helpers({
    frozen: function() {
	return frozen();
    },
});

Template.abandoned.events({
    "click .lobby": function () {
	Meteor.call('setState', 'lobby');
    },
});
