Template.submit.events({
    "submit .survey": function(e) {
	e.preventDefault();
	Meteor.call('setPayment');
	var results = {'confusing': e.target.free.value}
	TurkServer.submitExitSurvey(results);
    },
});
