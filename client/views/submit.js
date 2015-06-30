Template.submit.helpers({
    params: function() {
	return Router.current().params.query;
    }
});


Template.submit.events({
    "click .submit": function (event) {
	Meteor.call('completeHIT', event.target.value);
    },
});
