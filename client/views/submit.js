Template.submit.helpers({
    params: function() {
	return Router.current().params.query;
    },
    submitURL: function() {
	return production? production_url: sandbox_url;
    }
});


Template.submit.events({
    "click .submit": function (event) {
	Meteor.call('completeHIT', event.target.value);
    },
});
