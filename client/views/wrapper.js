var helper = function(ttmt, recruiting, main) {
    if (ttmt == 'recruiting') {
	return recruiting;
    } else if (ttmt == 'main') {
	return main;
    } else {
	return 'blank';
    }
}

Template.home.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'landing-recruiting', 'landing-main');
    }
});

Template.lobbyBase.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'blank', 'lobby');
    }
});

Template.experiment.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'recruiting', 'game');
    }
});

Template.survey.helpers({
    active: function() {
	var ttmt = treatment();
	return helper(ttmt, 'timepicker', 'submit');
    }
});

Template.recruiting.helpers({
    active: function() {
	var obj = Recruiting.findOne();
	if (!obj) {return 'blank';}
	return obj.state;
    }
});

