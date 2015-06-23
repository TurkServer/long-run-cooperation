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
    Meteor.subscribe('games');
    Meteor.subscribe('users', function() {
	var params = Router.current().params.query;
	var wid = params.workerId;
	var user = Meteor.user();
	if (!wid) {
	    Meteor.logout();
	}
	if (wid && (!user || user.username != wid)) {
	    var result = Meteor.users.findOne({'username': params.workerId});
	    if (!result) {
		Accounts.createUser({'username': params.workerId, 
				     'password': params.workerId});		    
	    } else {
		Meteor.loginWithPassword(params.workerId, params.workerId);
	    }
	}
    });
});
