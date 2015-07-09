Template.wrapper.helpers({
    showStats: function() {
	return TurkServer.inExperiment();
    }
});

Template.main.helpers({
    active: function() {
	if (TurkServer.inExperiment()) {
	    return 'game';
	}
    }
});