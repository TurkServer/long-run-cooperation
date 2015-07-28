Meteor.publish("vizData", function(batchId, day) {
  if ( !TurkServer.isAdmin(this.userId) ) return [];

  // Right now we don't have a great way to link up GameGroups to a batch,
  // so use the following somewhat hacky method.

  // What is the earliest instance in this batch?
  let firstInst = Experiments.findOne({batchId}, {sort: {startTime: 1}});

  // TODO: find the game groups for this batchId and day

  console.log("returning stuff");

  return [
    Experiments.find(),
    GameGroups.direct.find(),
    Actions.direct.find()
  ];

});
