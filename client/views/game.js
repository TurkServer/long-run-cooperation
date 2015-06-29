Template.game.helpers({
    timeSpent: function() {
	var g = game();
	if (!g) { return; }
	var round_times = g.round_times;
	var start = g.roundTimes[g.roundTimes.length - 1];
	var now = new Date();
	var diff = Chronos.liveMoment(now).diff(start, 'seconds');
	if (diff == roundWait) {
	    Meteor.call('abandonGame');
	    if (g.state[pid()] == 'pending') {
		Meteor.call('goOffline');
		setTimeout(function(){
		    $('.submit').click();
		}, 1000);
	    } else {
		Meteor.call('setState', 'lobby');
	    }
	}
	return diff;
    },
    roundWait: function() {
	return roundWait;
    },
    offline: function() {
	var user = Meteor.user();
	return user && !user.status.online;
    },
    gameNum: function() {
	var user = Meteor.user();
	return user && user.games && user.games.length + 1;
    },
    numGames: function() {
	return numGames;
    },
    notDone: function() {
	var u = Meteor.user();
	return u && u.games && u.games.length < numGames;
    },
    invited: function() {
	var u = Meteor.user();
	return u && u.game.invited;
    },
    opponentOffline: function() {
	var o = opponent();
	var g = game();
	return g && o && !opponent().status.online && g.status=='playing';
    },
    round: function() {
	var g = game();
	return g && game().round;
    },
    showPrevious: function() {
	var g = game();
	return g && game().round > 1;   
    },
    pending: function() {
	var g = game();
	return g && g.state[pid()] == 'pending';
    },
    turn_over: function() {
	var g = game();
	return g && g.state[pid()] == 'completed';
    },
    results: function() {
	var g = game();
	if (!g) { return; }
	var p_id = pid();
	var o_id = oid();
	var oname = opponent().username;
	var objects = [];
	var colors = {'1': 'green',
		      '2': 'red'}
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
	if (!g) { return; }
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
	return g && g.status != 'over';
    }
});

Template.game.events({
    "click .cooperate": function () {
	Meteor.call('completeMove', '1');	
    },
    "click .defect": function () {
	Meteor.call('completeMove', '2');
    },
    "click .return": function () {
	Meteor.call('setState', 'lobby');
    },
});
