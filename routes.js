Router.map(function() {
    this.route('wrapper', {
	path: '/',
	data: function() {
	    return {params: this.params.query}
	},
    });
});
