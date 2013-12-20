define([
	'jquery',
	'backbone',
	'underscore'
	],
function($,Backbone,_) {
	var ConfigurationModel = Backbone.Model.extend({
		defaults: {
			feedUser: '',
			feedStory: '',
			displayName: true,
			displayHandle: true,
			displayTime: true,
			displaySource: false
		},
		urlRoot: "/fetchStory",
		initialize: function() {
			// new model created, add it to the master app object
			window.app.models.configurationModel = this;
		}
	});
	return ConfigurationModel;
});