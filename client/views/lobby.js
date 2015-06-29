var start = new Date();

// Tracker.autorun(function() {
//     var now = new Date();
//     var diff = Chronos.liveMoment(now).diff(start, 'seconds');
//     var p = players();
//     var count = p && p.count();
//     if ((diff == lobbyWait) && !count) {
// 	Session.set('frozen', true);
//     }
// });

Template.lobby.helpers({
    empty: function() {
	var p = players();
	return p && players().count() == 0;	
    },
    frozen: function() {
	return frozen();
    },
    lobbyWait: function() {
	return lobbyWait;
    }
});

Template.lobby.events({
    "click .get-matched": function () {
	var count = players().count();
	var random = Math.floor(Math.random() * count);
	var opponent = Meteor.users.findOne(online(),
					    {skip: random});
	Meteor.call("matchPlayers", pid(), opponent._id);
    }
});
