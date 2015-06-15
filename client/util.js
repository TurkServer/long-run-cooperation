pid = function() {
    var u = Meteor.user();
    return u && u._id;
};

oid = function() {    
    var p = player();
    return p && p.game.opponent_id;

};

gid = function() {
    var p = player();
    return p && p.game.game_id;
};

online = function() {
    return {_id: {$ne: pid()},
	    "status.online": true,
	    state: 'lobby'};
};

players = function() {
    return Meteor.users.find(online());
};

player = function() {
    return Meteor.user();
};

opponent = function() {
    var p = player();
    return p && Meteor.users.findOne(p.game.opponent_id);
};

game = function() {
    var p = player();
    return p && Games.findOne(p.game.game_id);
};

player_state = function() {
    var p = player();
    return p.state;
};

sum = function(array) {
    var total = 0;
    for (var i=0; i<array.length; i++) {
	total += array[i];
    }
    return total;
}
