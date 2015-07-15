Template.lobbypilot.helpers({
    'notReady': function() {
	var obj = LobbyStatus.findOne(Meteor.userId());
	return obj && !obj.status;
    },
    'numPlayers': function() {
	return numPlayers;
    },
    'numWaiting': function() {
	return LobbyStatus.find({'status': true}).count();
    },
    'plural': function() {
	var count = LobbyStatus.find({'status': true}).count();
	return count > 1;
    }
});

Template.lobbypilot.events({
    'click .begin': function() {
	Meteor.call('toggleStatus');
    }
});
