// results view
define([
	'jquery',
	'backbone',
	'underscore',
	'moment',
	'app/models/ResultsModel',
	'text!app/templates/citation.html'],
function($, Backbone, _, moment, ResultsModel, CitationTemplate) {
	var CitationsView = Backbone.View.extend({
		el: "#output-citations",
		events: {
			'change select#citation-format': 'changedCitationFormat'
		},
		changedCitationFormat: function() {
			this.render();
		},
		render: function() {
			var renderedHtml = _.template(CitationTemplate, {
				results: this.collection.models,
				citationStyle: $("#citation-format").val()
			});
			this.$el.children("#citation-content").html(renderedHtml);
		}
	});

	return CitationsView;
});