assignmentId = function() {
    var asst = Assignments.findOne();
    return asst && asst.assignmentId;
}
