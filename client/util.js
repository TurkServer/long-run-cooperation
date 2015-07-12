assignmentId = function() {
    var asst = Assignments.findOne();
    return asst && asst.assignmentId;
}

batchId = function() {
    return TurkServer.batch()._id;
}
