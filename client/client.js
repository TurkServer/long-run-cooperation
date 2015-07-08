$('.alert').alert()

Tracker.autorun(function() {
    if (TurkServer.inExperiment()) {
	Router.go('/');
    }
});

Tracker.autorun(function() {
    var group = TurkServer.group();
    Meteor.subscribe('users', group);
    Meteor.subscribe('games', group);
});
