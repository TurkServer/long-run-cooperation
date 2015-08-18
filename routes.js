Router.map(function() {
    // authentication?
    // see lobby_client.coffee in TurkServer
    this.route('home', {
	path: '/',
	template: 'home'
    });
    this.route('lobby', {
	path: '/lobby',
	template: 'lobby'
    });
    this.route('experiment', {
	path: '/experiment',
	layoutTemplate: 'wrapper',
	template: 'experiment'
    });
    this.route('survey', {
	path: '/survey',
	layoutTemplate: 'wrapper',
	template: 'survey'
    });
    this.route('exitsurvey', {
	path: '/exitsurvey',
	template: 'exitsurvey'
    });

});
