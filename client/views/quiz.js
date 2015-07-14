var Questions = new Meteor.Collection(null)
var question1 = {text: '1. If you choose 1 and your opponent chooses 2, how much payoff will you receive?',
		 answer: payoffs.S,
		 correct: false,
		 answered: false};
var question2  = {text: '2. If you choose 2 and your opponent chooses 1, how much payoff will you receive?',
		  answer: payoffs.T,
		  correct: false,
		  answered: false};
Questions.insert(question1);
Questions.insert(question2);

Template.quiz.helpers({
    questions: function() {
	return Questions.find();
    },
    incorrect: function() {
	var obj = Recruiting.findOne();
	return obj && obj.attempts == 1;
    },
});

Template.quiz.events({
    "submit .quiz": function (e) {
	e.preventDefault();
	var form = e.target;
	Questions.find().forEach(function(obj) {
	    var val = form[obj._id].value;
	    var correct = val == obj.answer ? true: false;
	    Questions.update({_id: obj._id},
			     {$set: {correct: correct,
				     answered: true}});
	});
	var correct = Questions.find({correct: true}).count() == 2;
	if (correct) {
	    Meteor.call('endQuiz');
	} else {
	    Meteor.call('incQuiz');
	    var obj = Recruiting.findOne();
	    if (obj && obj.attempts == 2) {
		Session.set('failedQuiz', true);
		Meteor.call('endQuiz');
	    }
	}
    },
});

Template.question.helpers({
    incorrect: function() {
	return this.answered && !this.correct;
    }
});
			  
