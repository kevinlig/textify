// entry point for the backbone app
define([
		'jquery',
		'backbone',
		'underscore',
		'app/views/ConfigurationView'
	],
function($,Backbone,_, ConfigurationView) {

	function App () {
		// our Backbone app object will hold models, collections, and views
		this.views = this.views || {};
		this.collections = this.collections || {};
		this.models = this.models || {};

		// now let's init the app
		this.init = function() {
			// on app launch, we should tie the ConfigurationView to the DOM form
			this.views.configurationView = new ConfigurationView({});
		}
	}

	return App;
});
