// collection of Storify result models (tweets)
define([
	'jquery',
	'backbone',
	'app/models/ResultsModel'],
function($, Backbone, ResultsModel) {

	var ResultsCollection = Backbone.Collection.extend({
		model: ResultsModel
	});
	return ResultsCollection;
});
