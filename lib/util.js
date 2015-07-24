testingFuncs = {};

today = function() {
    return moment().format('MM-DD-YYYY');
}

treatment = function() {
   var batch = TurkServer.batch();
    if (!batch) {return;}
    return batch.treatments;
}

oppId = function() {
    var inst = Experiments.findOne();
    if (!inst) {return;}
    var users = inst.users;
    var opponentId = _.filter(users, function(userId) {
	return userId != Meteor.userId();
    });
    if (!opponentId) {return;}
    else {return opponentId[0];}
}

assignmentId = function() {
    var asst = Assignments.findOne();
    return asst && asst.assignmentId;
}

batchId = function() {
    return TurkServer.batch()._id;
}

currentRound = function() {
    var round = Rounds.findOne({}, {sort: {index: -1}});
    return round.index;
}
