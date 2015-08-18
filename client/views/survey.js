var bins = [
	[0],
	[1, 4],
	[5, 9],
	[10, 49],
	[50, 99],
	[100]
];

Template.numberRadioButtons.helpers({
	options: bins.map(function(bin) {
		if (bin[0] === 0) {
			return {
				value: 0,
				caption: "none"
			}
		}
		else if (bin.length === 1) {
			return {
				value: bin[0] + "+",
				caption: bin[0] + " or more"
			}
		}
		else {
			return {
				value: bin[0] + "-" + bin[1],
				caption: bin[0] + " to " + bin[1]
			}
		}
	}),
	attributes: function() {
		return Template.parentData();
	}
});

Template.exitsurvey.events({
    "submit .survey": function(e, tmpl) {
	e.preventDefault();
	var form = e.target;
	var gender = tmpl.find("select[name=gender]").value;
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
		   "future": form.future.value,
		"misc": form.misc.value
	};
	TurkServer.submitExitSurvey(results);
    }
});
