var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

TurkServer.Assigners.PairAssigner = (function(superClass) {
  extend(PairAssigner, superClass);

  function PairAssigner() {
    return PairAssigner.__super__.constructor.apply(this, arguments);
  }

  PairAssigner.prototype.initialize = function() {
      PairAssigner.__super__.initialize.apply(this, arguments);
      this.counter = 0;
      this.lobby.events.on("next-round", (function(_this) {
	  return function() {
	      var treatment = [];
	      var lobbyAssts = _this.lobby.getAssignments();
	      if (lobbyAssts.length > 0) {
		  _this.counter += 1;
		  var shuffledAssts = _.shuffle(lobbyAssts);
		  console.log(shuffledAssts);
		  var pairs = _.groupBy(shuffledAssts, function(element, index) {return Math.floor(index/2)});
		  for (var key in pairs) {
		      var instance = _this.batch.createInstance(_this.batch.getTreatments());
		      instance.setup();
		      var assts = pairs[key];
		      if (assts.length == 2) {
			  for (var i=0; i<2; i++) {
			      var asst = assts[i];
			      _this.lobby.pluckUsers([asst.userId]);
			      instance.addAssignment(asst);
			  }
		      }
		  }
	      }
	  };
      })(this));
  };

  PairAssigner.prototype.userJoined = function(asst) {
      if (asst.getInstances().length == 0) {
	  Sessions.insert({userId: asst.userId, 
			   day: today(),
			   games: 0,
			   bonus: 0});
      }
      if (this.counter == numGames) {
	  this.lobby.pluckUsers([asst.userId]);
	  asst.showExitSurvey();
      }
  };

  return PairAssigner;

})(TurkServer.Assigner);
