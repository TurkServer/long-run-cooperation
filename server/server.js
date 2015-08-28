Meteor.publish('gameData', function() {
    return [Meteor.users.find({}, {fields: {numGames: 1, bonus: 1}}),
	    Rounds.find(), Actions.find()];
});

// Meteor.publish('recruiting', function() { return Recruiting.find(); });

Meteor.startup(function () {
    Batches.upsert({name: 'pilot'}, {name: 'pilot', active: true});
    Batches.upsert({name: 'recruiting'}, {name: 'recruiting', active: true});
    Batches.upsert({name: 'exitsurvey'}, {name: 'exitsurvey', active: true});

    TurkServer.ensureTreatmentExists({name: 'main'});
    TurkServer.ensureTreatmentExists({name: 'recruiting'});
    TurkServer.ensureTreatmentExists({name: 'exitsurvey'});

    var batchid = Batches.findOne({name: 'pilot'})._id;
    Batches.update({name: 'pilot'}, {$addToSet: {treatments: 'main'}});

    var batchid = Batches.findOne({name: 'recruiting'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.SimpleAssigner);
    Batches.update({name: 'recruiting'}, {$addToSet: {treatments: 'recruiting'}});

    var batchid = Batches.findOne({name: 'exitsurvey'})._id;
    TurkServer.Batch.getBatch(batchid).setAssigner(new TurkServer.Assigners.ExitSurveyAssigner);
    Batches.update({name: 'exitsurvey'}, {$addToSet: {treatments: 'exitsurvey'},
					  $set: {allowReturns: true}});

    Batches.find({name: {$nin: ['recruiting', 'exitsurvey']}}).forEach(function(batch) {
	TurkServer.Batch.getBatch(batch._id).setAssigner(new TurkServer.Assigners.PairAssigner);
    });

    var hit1pm = {Title: hitTypeTitle1pm,
		  Description: "This HIT is for today's 1 PM ET session of the month-long research study for which you were granted a qualification.",
		  Keywords: 'study',
		  Reward: 0.1,
		  QualificationRequirement:["zkwuvJ9BX9BGWZod4", 
					    "ts6QjFu3SMis55ieq",
					    "o2NKn4Ksd2n5AoqHD",
					    "ugCPk8gwGEfZ2XzKG"],
		  AssignmentDurationInSeconds: 7200,
		  AutoApprovalDelayInSeconds: 60};

    var hit3pm = {Title: hitTypeTitle3pm,
		  Description: "This HIT is for today's 3 PM ET session of the month-long research study for which you were granted a qualification.",
		  Keywords: 'study',
		  Reward: 0.1,
		  QualificationRequirement:["zkwuvJ9BX9BGWZod4", 
					    "ts6QjFu3SMis55ieq",
					    "o2NKn4Ksd2n5AoqHD",
					    "ZYvKSTEFJJ4jfWYHf"],
		  AssignmentDurationInSeconds: 7200,
		  AutoApprovalDelayInSeconds: 60};
    
    HITTypes.upsert({Title: hitTypeTitle1pm},
    		    {$setOnInsert: hit1pm});

    HITTypes.upsert({Title: hitTypeTitle3pm},
    		    {$setOnInsert: hit3pm});

});

TurkServer.initialize(function() {
    if (this.instance.treatment().treatments.indexOf("recruiting") == -1) {
	initGame();
    } else {
	initRecruiting();
    }
});

TurkServer.Timers.onRoundEnd(function(reason) {
    if (reason === TurkServer.Timers.ROUND_END_TIMEOUT) {
	endGame('abandoned');
    }
});

Meteor.methods({
    goToLobby: function() {
        var userId = Meteor.userId();
        var inst = TurkServer.Instance.currentInstance();

        if( inst == null ) {
            console.log("No instance for " + userId, "; ignoring goToLobby");
            return;
        }
        inst.sendUserToLobby(Meteor.userId());
    },
    chooseAction: function(action, round) {
	if (isNaN(action)) {
	    throw new Error("Action from " + Meteor.userId() + " is NaN");
	}
        var serverRound = currentRound();
        if (round === serverRound) {
            chooseActionInternal(Meteor.userId(), action, round);
        } else {
            console.log('Client/server round discrepancy (client ' + round + ', server ' + serverRound + ')' +'; chooseAction ignored from ' + Meteor.userId());
        }
    },
    submitHIT: function() {
        submitHITInternal(Meteor.userId());
    },
    goToQuiz: function() {
        TurkServer.log({event: 'goToQuiz'});
        Recruiting.update({}, {$set: {'state': 'quiz'}});
    },
    incQuiz: function() {
        TurkServer.log({event: 'quizAttempt'});
        Recruiting.update({}, {$inc: {'attempts': 1}});
    },
    endQuiz: function() {
        TurkServer.log({event: 'passedQuiz'});
        TurkServer.Instance.currentInstance().teardown();
    },
    setSurveyBonus: function() {
	var asst = TurkServer.Assignment.currentAssignment();
	asst.setPayment(5);
    },
});

Partitioner.directOperation(function() {
    Rounds.find(
      {actions: 2, ended: false},
      // This ensures that both _groupId and index are available
      // while allowing us to still use a more efficient observeChanges
      { fields: {
          _groupId: 1,
          index: 1
      }}).observeChanges({
        added: function(id, fields) {
            Partitioner.bindGroup(fields._groupId, function() {
                endRound(fields.index);
            });
        }
    });
});

function initGame() {
    newRound(1);
    startTimer();
}

function initRecruiting() {
    Recruiting.insert({state: 'consent',
		       attempts: 0});
}

function startTimer() {
    var start = new Date();
    var end = new Date(start.getTime() + roundWait*60000);
    TurkServer.Timers.startNewRound(start, end);
}

function chooseActionInternal(userId, action, round) {
    var upsert = Actions.upsert({userId: userId,
				 roundIndex: round},
				{$setOnInsert: {
				    timestamp: new Date(),
				    action: action}});
    if (!upsert.insertedId) {
	console.log('Insert failed; chooseActionInternal ignored from ' + userId);
	return;
    }
    Rounds.update({index: round},
		  {$inc: {actions: 1}})
}

function submitHITInternal(userId) {
    var asst = TurkServer.Assignment.getCurrentUserAssignment(userId);
    var asstObj = Assignments.findOne({_id: asst.asstId});
    var numGames = asstObj.instances.length;
    var bonus = asstObj.bonusPayment;
    Meteor.users.update({_id: userId},
			{$inc: {numGames: numGames,
				bonus: bonus}});
    asst.setPayment(parseFloat(bonus.toFixed(2)));
}

function endRound(round) {
    var actionObjs = Actions.find({roundIndex: round}).fetch();
    if (actionObjs.length !== 2) {
	console.log('More/less than 2 action objects: ');
	console.log(actionObjs);
    }
    var userIds = [];
    var actions = [];
    _.each(actionObjs, function(obj) {
	userIds.push(obj.userId);
	actions.push(obj.action);
    });
    var payoffs = payoffMap[actions[0]][actions[1]];
    var results = {};
    results[userIds[0]] = {action: actions[0], payoff: payoffs[0]};
    results[userIds[1]] = {action: actions[1], payoff: payoffs[1]};
    // don't need to do this here!
    // do it at the end of the game
    // for (var i=0; i<=1; i++) {
    // 	var asst = TurkServer.Assignment.getCurrentUserAssignment(userIds[i]);
    // 	asst.addPayment(payoffs[i]*conversion);
    // };
    sleep(100);
    if (round == numRounds) {
	// ending round 10
	// need to end round 10 before calling endGame, else
	// you won't get paid for round 10
	try {
	    // if the round hasn't already been ended by an abandonment,
	    // call endGame
	    TurkServer.Timers.endCurrentRound();
	    // only update the results of the round if game wasn't already abandoned
	    // otherwise will look like their bonus isn't high enough
	    Rounds.update({index: round}, {$set: {results: results, ended: true}});
	    endGame('finished');
	} catch (e) {
	    console.log("endRound: Couldn't endCurrentRound() for " + Partitioner.group());
	}
    } else {
	// ending any other round
	newRound(round+1);
	startTimer(); // will end the current round
	Rounds.update({index: round}, {$set: {results: results, ended: true}});
    }
}

function newRound(round) {
    Rounds.insert({index: round,
		   actions: 0,
		   ended: false});
}

function endGame(endReason) {
    var instance = TurkServer.Instance.currentInstance();
    var updated = Experiments.update({_id: instance.groupId, endReason: {$exists: false}},
				     {$set: {endReason: endReason}});
    if (updated == 0) { 
	console.log("endGame(" + endReason + "): Skipping double endGame() for " + instance.groupId);
	return false; 
    }
    var users = instance.users();
    var payoffs = {};
    payoffs[users[0]] = 0;
    payoffs[users[1]] = 0;
    Rounds.find({ended: true}).forEach(function(round) {
	var results = round.results;
	for (var userId in results) {
	    payoffs[userId] += results[userId].payoff;
	}
    });
    for (var userId in payoffs) {
	var asst = TurkServer.Assignment.getCurrentUserAssignment(userId);
	asst.addPayment(payoffs[userId]*conversion);
    }
    if ((endReason == 'abandoned') || (endReason == 'torndown')) {
	console.log("Instance " + instance.groupId + " was " + endReason + ".");
    }
    instance.teardown(false);
    return true;
}

testingFuncs.chooseActionInternal = chooseActionInternal;
testingFuncs.submitHITInternal = submitHITInternal;
globalFuncs.endGame = endGame;
