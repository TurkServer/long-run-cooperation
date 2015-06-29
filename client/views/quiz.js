var Questions = new Meteor.Collection(null)
var options = [{id: 1, value: 1, text: 22},
	       {id: 2, value: 2, text: 39},
	       {id: 3, value: 3, text: 51},
	       {id: 4, value: 4, text: 63}];
var question1 = {text: '1. If you choose 1 and your opponent chooses 2, how much payoff will you receive?',
		 answer: 22,
		 options: options};
var question2  = {text: '2. If you choose 2 and your opponent chooses 1, how much payoff will you receive?',
		  answer: 63,
		  options: options};
Questions.insert(question1);
Questions.insert(question2);


Template.quiz.helpers({
    questions: function() {
	return Questions.find();
    },
    correct: function() {
	return Questions.find({correct: true}).count() == 2;

    }
});

Template.quiz.events({
    "click .lobby": function (e) {
	e.preventDefault();
	Meteor.call('setState', 'lobby');
    },
});
			  
Template.question.events({
    'click input': function(e, template) {
	var qobj = template.data;
	var oobj = this;
	var options = qobj.options;
	var correct = false;
	for (var key in options) {
	    if (key == oobj.value - 1) {
		if (oobj.text != qobj.answer) {
		    options[key].error = true;
		} else {
		    options[key].success = true;
		    correct = true;
		}
	    } else {
		options[key].error = false;
		options[key].success = false;
	    }
	}
	Questions.update(qobj._id,
			 {$set: {options: options,
				 correct: correct}});;
    }
});
		     
