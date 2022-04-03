const fs = require('fs');

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

Meteor.methods({
  vizJson: function(batchName) {
    if ( !TurkServer.isAdmin(this.userId) ) return [];

    const batch = Batches.findOne({name: batchName});
    if ( !batch ) return [];
    const batchId = batch._id;

    const games = Experiments.find({batchId},
      {fields: {batchId: 0, treatments: 0}}).fetch();
    const gameIds = games.map(g => g._id);
    const userIds = _.uniq( _.flatten(games.map((g) => g.users)));
    const numMatchings = GameGroups.direct.find({batchId}).count();
    const actions = Actions.direct.find({_groupId: {$in: gameIds}},
      {fields: {_id: 0}}).fetch();

    const links = [];
    // For each user, generate a link for the list of games
    for( let userId of userIds) {
      const insts = Experiments.find({batchId, users: userId},
        {sort: {startTime: 1}}).fetch();

      for( let x = 1; x < insts.length; x++ ) {
        links.push({
          userId,
          source: insts[x-1]._id,
          target: insts[x]._id,
        });
      }
    }

    const output = {
      id: batchName,
      numMatchings,
      userIds,
      games,
      actions,
      links
    }

    const json = JSON.stringify(output, null, 2); //convert it back to json
    const fileName = `${batchName}.json`;
    fs.writeFile(fileName, json, 'utf8')
    console.log(`wrote ${fileName}.`);
  }
});

Meteor.publish("expData", function(expId) {
  if ( !TurkServer.isAdmin(this.userId) ) return [];
  var users = Experiments.findOne({_id: expId}).users;
  return [
    Meteor.users.find({_id: {$in: users}}),
    Experiments.find({_id: expId}),
    Actions.direct.find({_groupId: expId}),
    Rounds.direct.find({_groupId: expId}),
    RoundTimers.direct.find({_groupId: expId})
  ];
});
