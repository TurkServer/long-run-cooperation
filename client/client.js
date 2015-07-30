Tracker.autorun(function() {
  if (TurkServer.inLobby()) {
    var batch = TurkServer.batch();
    Meteor.subscribe('lobby', batch && batch._id);
    Router.go('/lobby');
  } else if (TurkServer.inExperiment()) {
    Router.go('/experiment');
  } else if (TurkServer.inExitSurvey()) {
    Router.go('/survey');
  }
});

Tracker.autorun(function() {
    var group = TurkServer.group();
    if (group == null) return;

    Meteor.subscribe('users', group);
    Meteor.subscribe('rounds', group);
    Meteor.subscribe('actions', group);
    Meteor.subscribe('games', group);
    Meteor.subscribe('recruiting', group);
});
