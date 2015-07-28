// Set up route for visualization
Router.map( function() {
  this.route('viz', {
    path: 'viz/:batchId',
    waitOn: function() {
      return Meteor.subscribe("vizData");
    }
  });
});

function flatten(arrayOfArrays) {
  return [].concat.apply([], arrayOfArrays);
}

function getColorScale(userIds) {
  if ( userIds.length < 10 ) return d3.scale.category10().domain(userIds);
  if ( userIds.length < 20 ) return d3.scale.category20().domain(userIds);
  throw new Error("Need to implement more than 20 colors");
}

Template.viz.onRendered(function() {
  let svg = d3.select(this.find("svg"));
  let $svg = this.$("svg");

  let height = $svg.height();
  let width = $svg.width();

  console.log(
    Experiments.find().count(),
    GameGroups.find().count(), // Only used to determine nodeWidth atm
    Actions.find().count()
  );

  // Instructions according to https://github.com/soxofaan/d3-plugin-captain-sankey

  // Generate list of nodes (instances), mapped to indices
  const instances = Experiments.find().fetch();
  const instanceMap = {};
  for( let [i, inst] of instances.entries() ) {
    instanceMap[inst._id] = i;
  }

  // Generate list of links (who went from one game to another)
  const users = _.uniq( flatten(
    Experiments.find().map( (g) => { return g.users }) ) );
  const rounds = GameGroups.find().count();

  const links = [];

  const colorScale = getColorScale(users);

  // For each user, generate a link for the list of games
  for( let userId of users) {
    const insts = Experiments.find({users: userId},
      {sort: {startTime: 1}}).fetch();

    for( let x = 1; x < insts.length; x++ ) {
      links.push({
        userId,
        source: instanceMap[insts[x-1]._id],
        target: instanceMap[insts[x]._id],
        value: 1
      });
    }
  }

  console.log(links);

  const sankey = d3.sankey()
    .size([width, height])
    .nodeWidth( (width * 0.5) / rounds )
    .nodePadding(10)
    .nodes(instances)
    .links(links)
    .layout(32);

  const path = sankey.link();

  // Draw links
  svg.selectAll('.link')
    .data(links)
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', path)
    .style({
      stroke: (d) => { return colorScale(d.userId) },
      "stroke-width": (d) => { return Math.max(1, d.dy) }
    });

  // Draw nodes
  let games = svg.selectAll('.node')
    .data(instances)
  .enter().append('g')
    .attr({
      'class': 'node',
      transform: (d) => { return `translate(${d.x}, ${d.y})` }
    });

  const nodeWidth = sankey.nodeWidth();

  games.append('rect')
    .attr({
      height: function (d) { return d.dy; },
      width: nodeWidth
    });

  // Within games, draw actions
  games.each( function(d) {
    const actions = Actions.find(
      {_groupId: d._id},
      {sort: {roundIndex: 1}}).fetch();

    const rounds = _.uniq(actions.map( (a) => { return a.roundIndex }), true);

    const x = d3.scale.ordinal()
      .domain(rounds)
      .rangeBands([0, nodeWidth]);

    const y = d3.scale.ordinal()
      .domain(d.users)
      .rangeBands([0, d.dy]);

    // Draw all the actions mwahaha
    d3.select(this).selectAll('.action')
      .data(actions)
    .enter().append('rect')
      .attr({
        'class': (d) => { return `action a${d.action}`},
        x: (d) => { return x(d.roundIndex) },
        y: (d) => { return y(d.userId) },
        width: x.rangeBand(),
        height: y.rangeBand()
      });

  });

});
