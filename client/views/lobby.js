Template.lobby.helpers({
    empty: function() {
	var p = players();
	return p && players().count() == 0;
	
    },
    waiting: function() {
	return players();
    },
});

Template.lobby.events({
    "click .get-matched": function () {
	var count = players().count();
	var random = Math.floor(Math.random() * count);
	var opponent = Meteor.users.findOne(online(),
					    {skip: random});
	Meteor.call("match_players", pid(), opponent._id);
    }
});
