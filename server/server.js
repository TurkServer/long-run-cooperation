Meteor.startup(function () {
    // publish all the non-idle players.
    Meteor.publish('players', function () {
      return Players.find({online: true});
    });

    // publish single games
    Meteor.publish('games', function () {
      return Games.find();
    });
});

// monitor/set idle players
Meteor.setInterval(function () {
  var now = (new Date()).getTime();
  var idle_threshold = now - 60*1000; // 60 sec

  Players.update({last_keepalive: {$lt: idle_threshold}},
                 {$set: {online: false}});

 }, 30*1000);

