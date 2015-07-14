Template.timepicker.helpers({
    failed: function() {
	return Attempts.find().count() == 2;
    },
});

Template.timepicker.events({
    "submit .survey": function(e, tmpl) {
	e.preventDefault();
	var attempts = Attempts.find().count();
	if (attempts == 2) {
	    TurkServer.submitExitSurvey({'failedQuiz': true});
	} else {
	    panel = {contact: tmpl.find("input[name=contact]").checked,
		     times: [tmpl.find("select[name=pickTime1]").value,
			     tmpl.find("select[name=pickTime1]").value,
			     tmpl.find("select[name=pickTime1]").value]};
	    results = {quizAttempts: attempts};			 
	    TurkServer.submitExitSurvey(results, panel);
	}
    }
});
