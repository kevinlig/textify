// configuration view
define([
	'jquery',
	'backbone',
	'underscore',
	'spin',
	'moment',
	'app/models/ConfigurationModel',
	'app/models/ResultsModel',
	'app/collections/ResultsCollection',
	'app/views/ResultsView',
	'app/views/CitationsView'],
function($, Backbone, _, Spinner, moment, ConfigurationModel, ResultsModel, ResultsCollection, ResultsView, CitationsView) {
	var ConfigurationView = Backbone.View.extend({
		el: "#storifyRequest",
		events: {
			'submit': 'submit',
			'change input[type=checkbox]': 'changeConfig'
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
		changeConfig: function(event) {
			var changedCheckbox = $(event.target);
			this.model.set(changedCheckbox.attr("data-model-attr"), changedCheckbox.is(":checked"));

			// if the results view is displayed, update it as well
			if (!$("#storify-output").hasClass("hide")) {
				window.app.views.resultsView.render();
			}
		},
		submit: function() {
			// don't do anything if the button is disabled
			if ($("#config-submit").hasClass("disabled")) {
				return false;
			}

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
			var endPos = inputUrl.length;
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
				if ($("#error-msg").hasClass("hiddenAlert")) {
					$("#error-msg").removeClass("hiddenAlert");
				}
				return false;
			}

			// hide the error message if it was previous displayed
			if (!$("#error-msg").hasClass("hiddenAlert")) {
				$("#error-msg").addClass("hiddenAlert");
			}

			if (!$("#storify-output").hasClass("hide")) {
				$("#storify-output").addClass("hide");
			}


			this.model.set('feedUser',urlElements[0]);
			this.model.set('feedStory',urlElements[1]);
			
			// get the display options
			this.model.set('displayName',$("#tweet-real-name").is(":checked"));
			this.model.set('displayHandle',$("#tweet-handle").is(":checked"));
			this.model.set('displayTime',$("#tweet-time").is(":checked"));
			this.model.set('displaySource',$("#tweet-link").is(":checked"));

			// show spinner
			this.startSpinner();

			var self = this;

			// fake a save event to POST to the server
			this.model.save({}, {
				success: function(model, response) {
					self.parseResponse(model.get('results'));					
				},
				error: function(model, response) {
					self.stopSpinner();

					// reset the model to its original form
					model.unset('type');
					model.unset('subtype');
					model.unset('totalTweets');
					model.unset('available');
					model.unset('resetTime');

					if (response.status == 429) {
						// a rate limit error
						var errorDetails = $.parseJSON(response.responseText);
						
						if (errorDetails.subtype == "Early Warning") {
							// we don't have enough Twitter calls to do this feed
							if ($("#late-warning").hasClass("hide") == false) {
								$("#late-warning").addClass("hide");
								$("#early-warning").removeClass("hide");
							}
							var currentTime = Math.round(new Date().getTime() / 1000);
							var timeRemaining = Math.ceil((errorDetails.resetTime - currentTime) / 60);

							var htmlString = "<p>This Storify feed has " + errorDetails.totalTweets + " tweet";
							if (errorDetails.totalTweets > 1) {
								htmlString += "s";
							}
							htmlString += ". Twitter will only allow Textify to retrieve " + errorDetails.available + " more tweets. ";
							htmlString += "This limit expires in " + timeRemaining + " minute";
							if (timeRemaining > 1) {
								htmlString += "s";
							}
							htmlString += ". Try again then.</p>";

							if (errorDetails.totalTweets > 180) {
								// impossible to display, too many!
								htmlString = "<p>This Storify feed has more than 180 tweets. Textify cannot display this feed because ";
								htmlString += "it exceeds Twitter's 180 tweet limit.</p>";
							}

							$("#early-warning").html(htmlString);

						}
						else {
							// show the standard rate limit error
							if ($("#late-warning").hasClass("hide")) {
								$("#late-warning").removeClass("hide");
							}
							if ($("#early-warning").hasClass("hide") == false) {
								$("#early-warning").addClass("hide");
							}
						}
						$("#error-ratelimit").foundation('reveal','open');
					}
					else if (response.status == 403) {
						// one of the server HTTP requests failed for some reason
						var errorDetails = $.parseJSON(response.responseText);
						$("#error-msg").html("<b>Error:</b> Textify ran into an error contacting " + errorDetails.type + ".");
						$("#error-msg").removeClass("hiddenAlert");
					}
					else {
						$("#error-msg").html("<b>Error:</b> Something went wrong. Try again later.");
						$("#error-msg").removeClass("hiddenAlert");
					}
				}
			});
			// returning false cancels the default form submit action (reload)
			return false;
		},

		startSpinner: function() {
			var opts = {
  				lines: 13, // The number of lines to draw
  				length: 5, // The length of each line
  				width: 2, // The line thickness
  				radius: 7, // The radius of the inner circle
  				corners: 1, // Corner roundness (0..1)
  				rotate: 0, // The rotation offset
  				direction: 1, // 1: clockwise, -1: counterclockwise
  				color: '#000', // #rgb or #rrggbb or array of colors
  				speed: 1, // Rounds per second
  				trail: 63, // Afterglow percentage
  				shadow: false, // Whether to render a shadow
  				hwaccel: false, // Whether to use hardware acceleration
  				className: 'spinner', // The CSS class to assign to the spinner
  				zIndex: 2e9, // The z-index (defaults to 2000000000)
			};
			var spinner = new Spinner(opts).spin($("#spinner")[0]);
			$("#config-submit").addClass("disabled");
		},

		stopSpinner: function() {
			$("#config-submit").removeClass("disabled");
			$("#spinner").html("");
		},
		parseResponse: function() {
			// we've received a valid response from the server, now we need to parse it
			// into a Backbone collection/model for a view
			if (typeof window.app.collections.resultsCollection == "undefined") {
				// create the results collection
				window.app.collections.resultsCollection = new ResultsCollection({});
			}

			// set the current language for timestamp
			moment().lang("en");

			// populate the collection
			var tweetCollection = window.app.collections.resultsCollection;
			// but first clear out the collection in case any default models or old data are there
			tweetCollection.reset();


			var tweetArray = this.model.get("results");
			for (var i = 0; i < tweetArray.length; i++) {
				var currentTweet = tweetArray[i];

				// create a new 
				var tweetModel = new ResultsModel({});
				for (var attribute in currentTweet) {
					tweetModel.set(attribute, currentTweet[attribute]);
				}

				// parse the time stamp into a MomentJS object
				var parsedTime = moment(currentTweet.timestamp, "ddd MMM DD HH:mm:ss ZZ YYYY");
				tweetModel.set("timestamp", parsedTime);

				// handle situation where tweet contents could not be retrieved
				if (typeof currentTweet.text == "undefined" || currentTweet.text == "") {
					tweetModel.set("text","[Tweet could not be retrieved]");
				}

				// determine if a first name/last name is available (for citation)
				var realname = currentTweet.realName;
				if (realname.indexOf(" ") > -1) {
					// at least one space exists
					// get the last name
					var nameArray = realname.split(" ");
					tweetModel.set("lastName", nameArray[nameArray.length - 1]);

					// get the remaining name
					var remainingName = "";
					for (var j = 0; j < nameArray.length - 1; j++) {
						remainingName += nameArray[j];
						if (j < nameArray.length - 2) {
							remainingName += " ";
						}
					}
					tweetModel.set("firstName", remainingName);
				}
				else if (realname != "") {
					tweetModel.set("lastName", realname);
				}

				// write into collection object
				tweetCollection.add(tweetModel);
			}

			// okay, we don't need the results attribute in the config model any more
			this.model.unset("results");

			var self = this;

			if (typeof window.app.views.resultsView == "undefined") {
				// create the results view
				// we need to also include the configuration information, so we're going to cheat the collection a bit
				window.app.views.resultsView = new ResultsView({
					collection: {
						results: tweetCollection,
						configuration: this.model
					}
				});
			}

			if (typeof window.app.views.citationsView == "undefined") {
				// create the citation view
				// no need for configuration information this time though!
				window.app.views.citationsView = new CitationsView({
					collection: tweetCollection
				});
			}

			/* we don't need to do anything extra if the view already exists because
			it's been bound to the tweet collection already */

			// render out the new data
			window.app.views.resultsView.render();
			window.app.views.citationsView.render();


			// display the results
			if ($("#storify-output").hasClass("hide")) {
				$("#storify-output").removeClass("hide");
			}
			$.scrollTo("#storify-output",500);
			this.stopSpinner();
		}
	});

	return ConfigurationView;
});