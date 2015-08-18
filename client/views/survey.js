Template.exitsurvey.events({
    "submit .survey": function(e, tmpl) {
	e.preventDefault();
	var form = e.target;
	var gender = tmpl.find("input[name=GenderOptions]:checked");
	var pd = tmpl.find("input[name=PD]:checked");
	var pg = tmpl.find("input[name=PG]:checked");
	results = {"age": form.age.value,
		   "gender": gender && gender.value,
		   "occupation": form.occupation.value,
		   "location": form.location.value,
		   "pd": pd && pd.value,
		   "pg": pg && pg.value,
		   "strategies": form.strategies.value,
		   "strategies_time": form.strategies_time.value,
		   "other_strategies": form.other_strategies.value,
		   "other_strategies_time": form.other_strategies_time.value,
		   "learn_yourself": form.learn_yourself.value,
		   "learn_others": form.learn_others.value,
		   "continued": form.continued.value,
		   "compensation": form.compensation.value,
		   "future": form.future.value}
	TurkServer.submitExitSurvey(results);
    }
});
