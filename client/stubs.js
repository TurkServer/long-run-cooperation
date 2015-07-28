Meteor.methods({
    chooseAction: function(action) {
	var upsert = Actions.upsert({userId: Meteor.userId(),
				     roundIndex: currentRound()},
				    {$setOnInsert: {
					timestamp: new Date(),
					action: action}});
    },
});
