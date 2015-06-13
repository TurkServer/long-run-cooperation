Meteor.startup(function () {

    Meteor.subscribe('players');
    Meteor.subscribe('games');

    var params = getParams();
    var player_name = params['player'];

    Meteor.call("get_player", player_name, function(err, data) {
	Session.set('player_id', data);
    });

    Meteor.call("get_opponent", function(err, data) {
	console.log(data);
    });

    Meteor.setInterval(function() {
	if (Meteor.status().connected) {
	    Meteor.call('keepalive', Session.get('player_id'));
	}
    }, 20*1000);


});