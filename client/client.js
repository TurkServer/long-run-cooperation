Meteor.startup(function() {
    Meteor.defer(function() {
	Tracker.autorun(function() {
	    var ttmt = treatment();
	    if (!ttmt) {return;}
	    if (TurkServer.inLobby()) {
		var batch = TurkServer.batch();
		Meteor.subscribe('lobby', batch && batch._id);
		Router.go(treatmentMap[ttmt]['lobbyRoute']);
	    } else if (TurkServer.inExperiment()) {
		Router.go(treatmentMap[ttmt]['experimentRoute']);
	    } else if (TurkServer.inExitSurvey()) {
		Router.go(treatmentMap[ttmt]['surveyRoute']);
	    }
	});
    });
});

Tracker.autorun(function() {
    var group = TurkServer.group();
    if (group == null) return;

    Meteor.subscribe('gameData', group);
});

// Tracker.autorun(function() {
//     var group = TurkServer.group();
//     if (group == null) return;

//     var batch = TurkServer.batch();
//     if (batch && batch.treatments.indexOf('recruiting') >= 0) {
// 	Meteor.subscribe('recruiting', group);
//     }
// });
