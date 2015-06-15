Meteor.startup(function () {
    Meteor.publish("users", function() {
	return Meteor.users.find({}, {
	    fields: {username: 1,
		     status: 1,
		     state: 1,
		     game: 1,
		     games: 1}});
    });
    Meteor.publish('games', function () {
      return Games.find();
    });
});

Accounts.onCreateUser(function(options, user) {
    user.state = 'lobby';
    user.game = {};
    user.games = [];
    return user;
});

