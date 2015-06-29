Template.submit.events({
    "click .submit": function () {
	Meteor.call('completeHIT');
    },
});
