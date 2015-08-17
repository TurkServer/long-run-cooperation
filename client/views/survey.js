Template.exitsurvey.events({
    "submit .survey": function(e) {
	e.preventDefault();
	results = {"test": e.target.test.value}
	TurkServer.submitExitSurvey(results);
    }
});
