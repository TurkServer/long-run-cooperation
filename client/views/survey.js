Template.exitsurvey.events({
    "submit .survey": function(e, tmpl) {
	e.preventDefault();
	form = e.target;
	results = {"age": form.age.value,
		   "gender": tmpl.find("input[name=GenderOptions]:checked").value,
		   "occupation": form.occupation.value,
		   "location": form.location.value,
		   "pd": tmpl.find("input[name=PD]:checked").value,
		   "pg": tmpl.find("input[name=PG]:checked").value,
		   "strategies": form.strategies.value,
		   "strategies_time": form.strategies_time.value,
		   "other_strategies": form.other_strategies.value,
		   "other_strategies_time": form.other_strategies_time.value,
		   "learn": form.learn.value,
		   "continued": form.continued.value,
		   "compensation": form.compensation.value,
		   "future": form.future.value}
	TurkServer.submitExitSurvey(results);
    }
});
