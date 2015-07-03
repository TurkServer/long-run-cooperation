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
		     quizAttempts: 1,
		     passedQuiz: 1}});
    });
    Meteor.publish('games', function () {
      return Games.find();
    });
});

Accounts.onCreateUser(function(options, user) {
    user.assignmentId = options.profile.assignmentId;
    user.state = 'instructions';
    user.game = {};
    user.games = [];
    user.treatment = 1;
    user.submitted = false;
    user.score = 0;
    user.quizAttempts = 0;
    user.passedQuiz = 0;
    return user;
});
