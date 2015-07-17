var helper = function(ttmt, recruiting, main) {
    if (_.indexOf(ttmt, 'recruiting') >= 0) {
	return recruiting;
    } else if (ttmt == 'main') {
	return main;
    } else {
	return 'blank';
    }
}

// before accepting
Template.home.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'landingRecruiting', 'landingMain');
    }
});

// lobby
Template.lobby.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'blank', 'lobbyMain');
    }
});

// experiment
Template.experiment.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'mainRecruiting', 'game');
    }
});

Template.mainRecruiting.helpers({
    active: function() {
	var obj = Recruiting.findOne();
	if (!obj) {return 'blank';}
	return obj.state;
    }
});

// survey
Template.survey.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'timepicker', 'submit');
    }
});
