Meteor.publish("vizData", function(batchId) {
  if ( !TurkServer.isAdmin(this.userId) ) return [];

  // Get all the groups in this batch
  const instances = Experiments.find({batchId}).map(
    (e) => { return e._id });

  return [
    Experiments.find({batchId}),
    GameGroups.direct.find({batchId}),
    Actions.direct.find({_groupId: {$in: instances}})
  ];
});
