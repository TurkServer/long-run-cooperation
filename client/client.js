Template.wrapper.helpers({
    isTurk: function() {
	return this.params.workerId;
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
    },
});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

Meteor.startup(function () {
    $('.alert').alert()
    Meteor.subscribe('users');
    Meteor.subscribe('games');
});
