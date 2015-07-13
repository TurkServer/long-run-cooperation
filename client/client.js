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
    Meteor.subscribe('users', group);
    Meteor.subscribe('rounds', group);
    Meteor.subscribe('games', group);
    Meteor.subscribe('sessions', Meteor.userId());
});

Tracker.autorun(function() {
    var opp = Meteor.users.findOne({_id: {$ne: Meteor.userId()}});
    if (!opp) {return;}
    Meteor.subscribe('sessions', opp._id);
});
