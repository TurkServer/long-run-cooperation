Router.map(function() {
    this.route('expAdmin', {
	path: 'exp/:groupId',
	waitOn: function() {
	    return Meteor.subscribe("expData", this.params.groupId);
	},
	data: function() {
	    return {groupId: this.params.groupId}
	},
	template: 'expAdmin',
    });
});

Template.expAdmin.helpers({
    groupId: function() {
	return this.groupId;
    },
});

Template.expAdminOld.helpers({
    actions: function() {
	return Actions.find({}, {sort: {roundIndex: 1,
					userId: 1}});
    },
});

Template.actionAdmin.helpers({
    rowStyle: function() {
	return this.action == 1 ? "success" : "danger";
    },
    workerId: function() {
	return Meteor.users.findOne({_id: this.userId}).workerId;
    }
});

Template.expAdmin.onRendered(function () {
    var margin = {top: 10, right: 10, bottom: 10, left: 10}
    var barWidth = 8;
    var barHeight = 80;
    var barSep = 30;
    var leftPadding = 120;
    var topPadding = 10;

    var width = leftPadding + 1000 - margin.left - margin.right;
    var height = (barHeight*2 + 100) - margin.top - margin.bottom;

    var actions = Actions.find({}, {sort: {timestamp: 1}}).fetch();
    var rounds = RoundTimers.find({}, {sort: {startTime: 1}}).fetch();
    
    var userMap = {};
    var workerIds = [];
    var users = Experiments.findOne().users;

    for (var i=0; i<users.length; i++) {
	userMap[users[i]] = i;
	var workerId = Meteor.users.findOne({_id: users[i]}).workerId;
	workerIds.push(workerId);
    }

    var svg = d3.select(this.find("svg"))
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // add workerId labels
    svg.selectAll("text")
	.data(workerIds)
	.enter()
	.append("text")
	.attr("class", "text")
	.text(function(d) {return d})
	.attr("x", 0)
	.attr("y", function(d, i) {return i*(barHeight) + (i*25) + 60;})


    function minX() {
	return roundStart = d3.min(rounds, function(d) {
	    return d['startTime'];
	});
    }

    function maxX() {
	return d3.max(actions, function(d) {
	    return d['timestamp'];
	});
    }

    var x = d3.scale.linear()
	.domain([minX(), maxX()])
	.range([leftPadding, width]);

    var xAxis = d3.svg.axis()
	.scale(x)
	.orient("top")
	.tickFormat(function(d) {
	    return d3.time.format('%H:%M:%S')(new Date(d));
	});

    svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);
        
    function redraw() {
	x.domain([minX(), maxX()]);

	// draw vertical round lines
	var lines = svg.selectAll("line")
	    .data(rounds, function(d) {
		return d._id;
	    });

	// add new
	lines.enter()
            .append("line")
            .style("stroke-width", 1)
            .style("stroke", "black")
	    .style("opacity", 0.75)
            .attr("y1", topPadding)
            .attr("y2", height);

	// update all
	lines.attr("x1", function(d) {
	    return x(d['startTime']);
	}).attr("x2", function(d) {
	    return x(d['startTime']);
	});

	// draw round line labels
	var labels = svg.selectAll("text.round")
	    .data(rounds, function(d) {
		return d._id;
	    });

	// add new
	labels.enter()
            .append("text")
            .attr("class", "text round")
	    .text(function(d) {return d.index})
            .attr("y", 0);

	// update all
	// shift a bit left to be on top of line
	labels.attr("x", function(d) {
	    return x(new Date(d['startTime'].valueOf() - 100));
	})

	// draw axis now (on top of round lines)
	svg.select("g.axis").call(xAxis);

	// label the second action (used to determine x position)
	var groupedActions = _.groupBy(actions, function(e, i) {
	    return Math.floor(i/2)
	});
	for (var key in groupedActions) {
	    var acts = groupedActions[key];
	    if (acts.length == 2) {
		acts[1]['secondAction'] = true;
	    }
	}

	// draw action bars
	var bars = svg.selectAll("rect")
	    .data(actions, function(d) {
		return d._id;
	    });

	// add new
	bars.enter()
	    .append("rect")
	    .attr("y", function(d) {
		return userMap[d['userId']] == 0 ? topPadding : barHeight + barSep;
	    })
	    .attr("fill", function(d) {
		return d['action'] == 1 ? "green" : "red"
	    })
	    .attr("width", barWidth)
	    .attr("height", barHeight);

	// update all
	// shift second action a bit left to account for server delay
	bars.attr("x", function(d) {
	    if (d['secondAction']) {
		return x(new Date(d['timestamp'].valueOf() - 500));
	    } else {
		return x(d['timestamp']);
	    }
	});

    }

    
    // redraw when new action gets made
    this.handle = Actions.find().observe({
	added: function(doc) {
	    actions.push(doc);
	    Meteor.defer(redraw);
	}
    });
    
    this.handle = RoundTimers.find().observe({
	added: function(doc) {
	    rounds.push(doc);
	}
    });

});
