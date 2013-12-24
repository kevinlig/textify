// results view
define([
	'jquery',
	'backbone',
	'underscore',
	'moment',
	'app/models/ResultsModel',
	'text!app/templates/tweet.html'],
function($, Backbone, _, moment, ResultsModel, TweetTemplate) {
	var ResultsView = Backbone.View.extend({
		el: "#tweet-content",
		render: function() {
			var renderedHtml = _.template(TweetTemplate, {
				results: this.collection.results.models,
				configuration: this.collection.configuration
			});
			this.$el.html(renderedHtml);
		}
	});

	return ResultsView;
});