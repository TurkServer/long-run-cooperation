Template.submit.events({
    "submit .survey": function (e) {
	e.preventDefault();
	var results = {'confusing': e.target.free.value}
	TurkServer.submitExitSurvey(results);
    },
});
