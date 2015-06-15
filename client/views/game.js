Template.game.helpers({
    opponent_offline: function() {
	var o = opponent();
	return o && !opponent().status.online;
    },
    round: function() {
	var g = game();
	return g && game().round;
    },
    state: function() {
	var g = game();
	if (g.state[pid()] == 'pending') {
	    return 'Make a choice:';
	} else {
	    return 'Waiting on other player.';
	}
    },
    turn_over: function() {
	var g = game();
	return g && g.state[pid()] == 'completed';
    },
    results: function() {
	var g = game();
	if (!g) {
	    return;
	}
	var p_id = pid();
	var o_id = oid();
	var oname = opponent().username;
	var objects = [];
	var colors = {'cooperate': 'green',
		      'defect': 'red'}
	for (i=2; i<=g.round; i++) {
	    pchoice = g.moves[p_id][i-2];
	    ochoice = g.moves[o_id][i-2];
	    pscore = g.scores[p_id][i-2];
	    oscore = g.scores[o_id][i-2];
	    var object = {'round_': i-1,
			  'pchoice': pchoice,
			  'pscore': pscore,
			  'pchoice_color': colors[pchoice],
			  'oname': oname,
			  'ochoice': ochoice,
			  'oscore': oscore,
			  'ochoice_color': colors[ochoice]};
	    objects.push(object);
	}
	return objects;
    },
    payoffs: function() {
	var g = game();
	if (!g) {
	    return;
	}
	var p_id = pid();
	var o_id = oid();
	var oname = opponent().username;
	var object = {'you': 0,
		      'opponent': 0};
	for (i=2; i<=g.round; i++) {
	    pscore = g.scores[p_id][i-2];
	    oscore = g.scores[o_id][i-2];
	    object['you'] += pscore;
	    object['opponent'] += oscore;
	}
	return object;
    },
    playing: function() {
	var g = game();
	return g && g.status == 'playing';
    }
});

Template.game.events({
    "click .cooperate": function () {
	Meteor.call('complete_move', gid(), pid(), 'cooperate');	
    },
    "click .defect": function () {
	Meteor.call('complete_move', gid(), pid(), 'defect');
    },
    "click .return": function () {
	Meteor.call('end_game', pid(), gid());
    },
    "click .abandon": function () {
	Meteor.call('abandon_game', gid(), pid(), oid());
    },

});
