batchId = function() {
    var batch = TurkServer.Batch.currentBatch();
    return batch && batch.batchId;
}
