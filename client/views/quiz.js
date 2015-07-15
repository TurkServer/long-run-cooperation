var Questions = new Meteor.Collection(null)
var question1 = {text: '1. If you choose 1 and your opponent chooses 1, how much payoff will you receive?',
		 answer: payoffs.R,
		 correct: false,
		 answered: false};
var question2 = {text: '2. If you choose 1 and your opponent chooses 2, how much payoff will you receive?',
		 answer: payoffs.S,
		 correct: false,
		 answered: false};
var question3  = {text: '3. If you choose 2 and your opponent chooses 1, how much payoff will you receive?',
		  answer: payoffs.T,
		  correct: false,
		  answered: false};
var question4  = {text: '4. If you choose 2 and your opponent chooses 2, how much payoff will you receive?',
		  answer: payoffs.P,
		  correct: false,
		  answered: false};
Questions.insert(question1);
Questions.insert(question2);
Questions.insert(question3);
Questions.insert(question4);

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
	var correct = Questions.find({correct: true}).count() == Questions.find().count();
	if (correct) {
	    Meteor.call('endQuiz');
	} else {
	    var obj = Recruiting.findOne();
	    Meteor.call('incQuiz');
	    if (obj && obj.attempts == 1) {
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
			  
