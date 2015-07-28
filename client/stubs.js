Meteor.methods({
    chooseAction: function(action) {
	console.log('here');
	var upsert = Actions.upsert({userId: Meteor.userId(),
				     roundIndex: currentRound()},
				    {$setOnInsert: {
					timestamp: new Date(),
					action: action}});
    },
});
