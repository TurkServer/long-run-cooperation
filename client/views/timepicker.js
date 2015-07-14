Template.timepicker.helpers({
    failed: function() {
	return Session.get('failedQuiz');
    },
});

Template.timepicker.events({
    "submit .survey": function(e, tmpl) {
	e.preventDefault();
	if (Session.get('failedQuiz')) {
	    TurkServer.submitExitSurvey({'failedQuiz': true});
	} else {
	    panel = {contact: tmpl.find("input[name=contact]").checked,
		     times: [tmpl.find("select[name=pickTime1]").value,
			     tmpl.find("select[name=pickTime2]").value,
			     tmpl.find("select[name=pickTime3]").value]};
	    TurkServer.submitExitSurvey({}, panel);
	}
    }
});
