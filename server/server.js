Meteor.publish("users", function() {
    return Meteor.users.find();
});

Meteor.startup(function () {
    Batches.upsert({name: 'testing'}, {name: 'testing'});
    var batchid = Batches.findOne({name: 'testing'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.TestAssigner);
});
