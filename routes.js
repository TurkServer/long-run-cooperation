Router.map(function() {
    // authentication?
    // see lobby_client.coffee in TurkServer
    this.route('home', {
	path: '/',
	layoutTemplate: 'wrapper',
	template: 'home'
    });
    this.route('lobby', {
	path: '/lobby',
	layoutTemplate: 'wrapper',
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
	layoutTemplate: 'wrapper',
	template: 'exitsurvey'
    });

});
