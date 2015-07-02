Meteor.startup(function () {
    Meteor.publish("users", function() {
	return Meteor.users.find({}, {
	    fields: {username: 1,
		     status: 1,
		     state: 1,
		     game: 1,
		     games: 1,
		     treatment: 1,
		     submitted: 1,
		     score: 1,
		     quiz: 1,
		     number: 1}});
    });
    Meteor.publish('games', function () {
      return Games.find();
    });
});

Accounts.onCreateUser(function(options, user) {
    var numbers = [0];
    Meteor.users.find().forEach(function(obj) {
	numbers.push(obj.number);
    });
    user.assignmentId = options.profile.assignmentId;
    user.state = 'instructions';
    user.game = {};
    user.games = [];
    user.treatment = 1;
    user.submitted = false;
    user.score = 0;
    user.quiz = 0;
    user.number = Math.max.apply(Math, numbers) + 1;
    return user;
});

