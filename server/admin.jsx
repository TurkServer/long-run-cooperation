Meteor.publish("vizData", function(batchName) {
  if ( !TurkServer.isAdmin(this.userId) ) return [];

  const batch = Batches.findOne({name: batchName});
  if ( !batch ) return [];
  const batchId = batch._id;

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
  var users = Experiments.findOne({_id: expId}).users;
  return [
    Meteor.users.find({_id: {$in: users}}),
    Experiments.find({_id: expId}),
    Actions.direct.find({_groupId: expId}),
    Rounds.direct.find({_groupId: expId}),
  ];
});
