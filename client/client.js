Template.main.helpers({
    active: function() {
	if (Meteor.loggingIn()) {
	    return 'loading';
	}
	if (Meteor.user()) {
	    return player_state();
	}
	return 'loggedout';
    }
});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

Meteor.startup(function () {

    Meteor.subscribe('users');
    Meteor.subscribe('games');

});
