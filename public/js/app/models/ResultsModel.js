define([
	'jquery',
	'backbone',
	'underscore'
	],
function($,Backbone,_) {
	var ResultsModel = Backbone.Model.extend({
		defaults: {
			tweetId: "",
			permalink: "",
			twitterHandle: "",
			realName: "",
			text: "",
			timestamp: ""
		}
	});
	return ResultsModel;
});