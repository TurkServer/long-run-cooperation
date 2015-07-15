Template.consent.events({
    "submit .consent": function (e, tmpl) {
	e.preventDefault();
	var checked = tmpl.find("input[name=agree]").checked;
	if (!checked) {
	    alert('Please accept the terms before continuing.');
	} else {
	    Meteor.call('goToQuiz');
	}
    },
});
