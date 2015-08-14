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

Meteor.publish("expData", function(expId) {
  if ( !TurkServer.isAdmin(this.userId) ) return [];
  return [
    Experiments.find({_id: expId}),
    Actions.direct.find({_groupId: expId}),
    Rounds.direct.find({_groupId: expId}),
  ];
});
