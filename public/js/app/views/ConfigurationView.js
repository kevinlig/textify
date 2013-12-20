// configuration view
define([
	'jquery',
	'backbone',
	'underscore',
	'app/models/ConfigurationModel'],
function($, Backbone, _, ConfigurationModel) {
	var ConfigurationView = Backbone.View.extend({
		el: "#storifyRequest",
		events: {
			'submit': 'submit'
		},
		initialize: function() {
			// check if the configuration model already exists to prevent zombie objects
			if (typeof window.app.models.configurationModel != "undefined") {
				// it exists, bind that existing model to the view
				this.model = window.app.models.configurationModel;
			}
			else {
				// does not exist, create a new model
				this.model = new ConfigurationModel({});
			}
		},
		submit: function() {
			// perform some basic validation
			var inputUrl = $("#storify_url").val();
			if (inputUrl == "" || inputUrl.indexOf("storify.com/") < 0) {
				// no URL provided or not a Storify URL
				// show an error message
				$("#error-msg").html("<b>Error:</b> You must enter a valid Storify URL.");
				$("#error-msg").removeClass("hiddenAlert");
				return false;
			}

			// parse the Storify URL
			var startPos = inputUrl.indexOf("storify.com/") + 12;
			// end string position is either the end of the URL or a ? or ampersand symbol
			var endPos = inputUrl.length - 1;
			var ampPos = inputUrl.indexOf("&");
			var questionPos = inputUrl.indexOf("?");
			if (ampPos > startPos || questionPos > startPos) {
				// at least one of the two symbols was found at the end of the URL
				if (questionPos > 0) {
					// question mark was found
					if (ampPos > questionPos) {
						// both were found, question mark came first
						endPos = questionPos;
					}
					else if (ampPos > 0) {
						// both were found, ampersand came first
						endPos = ampPos;
					}
					else {
						// only question mark was found
						endPos = questionPos;
					}
				}
				else {
					// only ampersand was found
					endPos = ampPos;
				}
			}
			// substring the URL into an array
			var parsedUrl = inputUrl.substring(startPos,endPos);
			// blow it up by slashes
			var urlElements = parsedUrl.split("/");
			
			// validate it only has two elements
			if (urlElements.length != 2) {
				// error, kill it
				$("#error-msg").html("<b>Error:</b> Textify could not understand this URL. Verify you have entered a valid storify.com URL.");
				$("#error-msg").removeClass("hiddenAlert");
				return false;
			}

			// hide the error message if it was previous displayed
			if (!$("#error-msg").hasClass("hiddenAlert")) {
				$("#error-msg").addClass("hiddenAlert");
			}


			this.model.set('feedUser',urlElements[0]);
			this.model.set('feedStory',urlElements[1]);
			// get the display options
			this.model.set('displayName',$("#tweet-real-name").prop("checked"));
			this.model.set('displayHandle',$("#tweet-handle").prop("checked"));
			this.model.set('displayTime',$("#tweet-time").prop("checked"));
			this.model.set('displaySource',$("#tweet-link").prop("checked"));

			// fake a save event to POST to the server
			this.model.save({}, {
				success: function() {
					console.log("success");
				},
				error: function() {
					console.log("error");
				}
			});
			// returning false cancels the default form submit action (reload)
			return false;
		}
	});

	return ConfigurationView;
});