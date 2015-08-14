Router.map(function() {
    this.route('expAdmin', {
	path: 'exp/:expId',
	waitOn: function() {
	    return Meteor.subscribe("expData", this.params.expId);
	},
	template: 'expAdmin',
    });
});

Template.expAdmin.helpers({
    actions: function() {
	return Actions.find();
    }
});
