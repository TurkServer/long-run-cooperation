$('.alert').alert()

Tracker.autorun(function() {
    if (TurkServer.inLobby()) {
	Router.go('/lobby');
    } else if (TurkServer.inExperiment()) {
	Router.go('/game');
    } else if (TurkServer.inExitSurvey()) {
	Router.go('/survey');
    }
});

Tracker.autorun(function() {
    var group = TurkServer.group();
    Meteor.subscribe('collections', group);
});
