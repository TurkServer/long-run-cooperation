Template.lobbypilot.helpers({
    'numGames': function() {
	return numGames;
    },
    'numRounds': function() {
	return numRounds;
    },
    'roundWait': function() {
	return roundWait;
    },
    'payoffs': function() {
	return payoffs;
    },
    'notReady': function() {
	var obj = LobbyStatus.findOne(Meteor.userId());
	return obj && !obj.status;
    }
});

Template.lobbypilot.events({
    'click .begin': function() {
	Meteor.call('toggleStatus');
    }
});
