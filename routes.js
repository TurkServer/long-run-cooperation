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
    this.route('game', {
	path: '/game',
	layoutTemplate: 'wrapper',
	template: 'game'
    });
    this.route('survey', {
	path: '/survey',
	layoutTemplate: 'wrapper',
	template: 'submit'
    });
});
