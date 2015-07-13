assignmentId = function() {
    var asst = Assignments.findOne();
    return asst && asst.assignmentId;
}

treatment = function() {
   var batch = TurkServer.batch();
    if (!batch) {return;}
    return batch.treatments[0];
}
 

