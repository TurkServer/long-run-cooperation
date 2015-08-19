// before accepting
Template.home.helpers({
    ready: function() {
	return treatment();
    },
    active: function() {
	var ttmt = treatment();
	if (!ttmt) {return 'blank';}
	return treatmentMap[ttmt]['homeTemplate'];
    }
});

// experiment for recruiting treatment
Template.mainRecruiting.helpers({
    active: function() {
	var obj = Recruiting.findOne();
	if (!obj) {return 'blank';}
	return obj.state;
    }
});
