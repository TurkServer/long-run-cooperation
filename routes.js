var routes  = [];
for (var key in treatmentMap) {
    var obj = treatmentMap[key];
    routes.push(obj['lobbyRoute']);
    routes.push(obj['experimentRoute']);
    routes.push(obj['surveyRoute']);
}

_.each(_.uniq(routes), function(route) {
    Router.route(route);
});

Router.route('/', {
    template: 'home'
});
