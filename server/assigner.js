var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

TurkServer.Assigners.PairAssigner = (function(superClass) {
  extend(PairAssigner, superClass);

  function PairAssigner() {
    return PairAssigner.__super__.constructor.apply(this, arguments);
  }

  PairAssigner.prototype.userJoined = function(asst) {
      var treatment = [];
      var lobbyAssts = this.lobby.getAssignments();
      if (lobbyAssts.length == 2) {
	  this.instance = this.batch.createInstance(this.batch.getTreatments());
	  this.instance.setup();
	  for (var i=0; i<2; i++) {
	      var asst = lobbyAssts[i];
	      this.lobby.pluckUsers([asst.userId]);
	      this.instance.addAssignment(asst);
	      console.log(asst.getInstances());
	      Sessions.upsert({userId: asst.userId, 
			       day: today()}, 
			      {$inc: {games: 0,
				      bonus: 0}});
	  }
      }
  };

  return PairAssigner;

})(TurkServer.Assigner);
