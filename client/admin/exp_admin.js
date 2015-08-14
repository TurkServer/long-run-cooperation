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
	return Actions.find({}, {sort: {roundIndex: 1,
					userId: 1}});
    },
});

Template.actionAdmin.helpers({
    rowStyle: function() {
	return this.action == 1 ? "success" : "danger";
    },
    workerId: function() {
	return Meteor.users.findOne({_id: this.userId}).workerId;
    }
});
