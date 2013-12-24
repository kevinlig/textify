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
			firstName: "",
			lastName: "",
			text: "",
			timestamp: ""
		}
	});
	return ResultsModel;
});