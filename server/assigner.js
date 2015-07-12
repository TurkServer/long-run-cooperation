var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

TurkServer.Assigners.PairAssigner = (function(superClass) {
  extend(PairAssigner, superClass);

  function PairAssigner() {
    return PairAssigner.__super__.constructor.apply(this, arguments);
  }

  PairAssigner.prototype.initialize = function() {
      PairAssigner.__super__.initialize.apply(this, arguments);

      this.counter = 0; // counts how many games so far

      this.lobby.events.on("next-game", (function(_this) {
	  return function() {
	      var lobbyAssts = _this.lobby.getAssignments();
	      if (lobbyAssts.length > 1) { // avoid triggering by accident
		  _this.counter += 1;
		  var shuffledAssts = _.shuffle(lobbyAssts);
		  // see http://stackoverflow.com/questions/8566667/split-javascript-array-in-chunks-using-underscore-js
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
      if (asst.getInstances().length == 0) { // first instance of the day
	  Players.upsert({userId: asst.userId}, {userId: asst.userId});
	  Sessions.insert({userId: asst.userId, 
			   day: today(),
			   games: 0,
			   bonus: 0,
			   assignmentId: asst._id});
      }
      if (this.counter == numGames) { // numGames is global constant denoting how many games to have each day
	  this.lobby.pluckUsers([asst.userId]);
	  asst.showExitSurvey();
      }

      // JUST FOR TESTING
      var assts = this.lobby.getAssignments();
      if (assts.length == 2) {
	  var instance = this.batch.createInstance(this.batch.getTreatments());
	  instance.setup();
	  for (var i=0; i<2; i++) {
	      var asst = assts[i];
	      this.lobby.pluckUsers([asst.userId]);
	      instance.addAssignment(asst);
	  }
      }

  };

  return PairAssigner;

})(TurkServer.Assigner);
