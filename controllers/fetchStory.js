// extend express' routing
var request = require('request');
var fs = require('fs');

module.exports = function(app) {

	var finalResponse;
	var initialRequest;
	var configuration;

	var storifyElements = {};
	var tweetDetails = {};

	var pageRequests = 0;
	var totalPages = 0;
	var totalReceivedTweets = 0;
	var totalExpectedTweets = 0;

	var twitterAPICalls = 180;
	var twitterAPIReset = 0;

	app.post("/fetchStory", function(req,res) {
		configuration = req.body;
		finalResponse = res;
		initialRequest = req;
		
		// reset the data holding objects
		storifyElements = {};
		tweetDetails = {};

		/* before we continue, let's check how many Twitter API requests are available in this
		rate limit window. */
		var twitterCredentials = twitterAuthorization();
		checkTwitterRateLimit(twitterCredentials);
		
	});

	function initialStorifyRequest() {
		// make the request to the Storify API
		request.get("http://api.storify.com/v1/stories/" 
			+ configuration.feedUser + "/" 
			+ configuration.feedStory, 
			function(e,response, body) {
				if (e || response.statusCode != 200) {
					// could not reach Storify
					finalResponse.json(403, {type: 'Storify'});
					return;
				}

				/* a good reponse came back, so let's parse it
				we'll also pass the parsing function the original client request
				so we can pass back the original request body per Backbone's expectation */
				initialStorifyParse(body);
		});
	}

	function initialStorifyParse(data) {
		// okay, let's parse
		var parsedData = JSON.parse(data);
		var storifyData = parsedData.content;
		
		// Storify pages their results, so let's determine the total number of elements
		var totalElements = 0;

		// loop through all the element types and add their counts together to the total number
		for (var element in storifyData.stats.elements) {
			totalElements += storifyData.stats.elements[element];
		}
		
		// Storify generally pages their results to 20 a page, but let's verify in case it changed
		var itemsPerPage = storifyData.per_page;

		// determine how many requests we need to make
		totalPages = Math.ceil(totalElements / itemsPerPage);

		// do we have enough Twitter calls to do this?
		if (totalElements > twitterAPICalls) {
			// nope
			var responseObject = {
				type: 'Rate Limit',
				subtype: 'Early Warning',
				totalTweets: totalElements,
				available: twitterAPICalls,
				resetTime: twitterAPIReset
			};
			
			finalResponse.json(429, responseObject);
			return;
		}
		
		// let's grab the element data now
		// parse the result
		var pageElements = parseStorifyPage(data);
		// we are adding each page's elements as its own key, so that we can return the data in Storify's real order
		storifyElements['1'] = (pageElements);
		
		// loop through the remaining pages and grab them as well
		if (totalPages > 1) {
			pageRequests = 1;
			for (var i = 2; i <= totalPages; i++) {
				// start at page 2 because we already have page 1
				requestAdditionalStorifyPage(i, configuration.feedUser, configuration.feedStory);
			}
		}
		else {
			/* it may turn out there's only one page of data
			in that case, skip straight to the callback */
			receivedAllStorifyPages();

		}
	}

	function requestAdditionalStorifyPage(pageNumber, feedUser, feedStory) {
		// make the request to the Storify API, pipe it to a temp JSON file
		request.get("http://api.storify.com/v1/stories/" 
			+ feedUser + "/" + feedStory + "?page=" + pageNumber, 
			function(e,response, body) {
				if (e || response.statusCode != 200) {
					// could not reach Storify
					finalResponse.json(403, {type: 'Storify'});
					return;
				}

				// increment the module page count
				pageRequests++;

				// parse the result
				var pageElements = parseStorifyPage(body);
				storifyElements[pageNumber] = pageElements;

				/* check if we've gotten all the pages at this point
				we need to check in this function because this is the only time we know for sure
				the request has completed.
				since all requests are async, they may not return in the order they were made */
				if (pageRequests == totalPages) {
					// this is the final page needed, time to start the Twitter API calls
					receivedAllStorifyPages();
				}
		});
	}

	function parseStorifyPage(data) {
		var newPageData = JSON.parse(data);
		var storifyData = newPageData.content;

		var pageElements = [];

		// loop through each element on this page and get only tweets
		for (var i = 0; i < storifyData.elements.length; i++) {
			var currentElement = storifyData.elements[i];
			if (currentElement.type == "link" && currentElement.source.name == "twitter") {
				// this is a tweet
				// get the tweet ID
				var tweetUrl = currentElement.permalink;
				// explode the URL
				var explodedUrl = tweetUrl.split("/");

				// get the last element, this is the tweet ID
				var tweetId = explodedUrl[explodedUrl.length - 1];

				var tweetObj = {
					tweetId: tweetId,
					permalink: tweetUrl,
					twitterHandle: currentElement.attribution.username,
					realName: currentElement.attribution.name
				};

				pageElements.push(tweetObj);
				totalExpectedTweets++;
			}
		}

		return pageElements;
	}

	function receivedAllStorifyPages() {
		// callback function to be executed once all Storify pages have been received
		// get Twitter authorization
		var twitterCredentials = twitterAuthorization();

		// get tweet details
		for (var i = 1; i <= totalPages; i++) {
			var pageElements = storifyElements[i];
			for (var index in pageElements) {
				/* loop through each Storify tweet and get the data from Twitter
				this is because Storify only holds a partial string of the original tweet */
				var currentElement = pageElements[index];
				
				getTweetDetails(currentElement.tweetId, twitterCredentials);
				
			}
		}
	}


	function twitterAuthorization() {
		// we need to get our application twitter credentials
		if (process.env.NODE_ENV == "development") {
			// read the credential file, but only if development environment
			var rawCredentials = fs.readFileSync('credentials/credentials.json', 'utf8');
			var credentials = JSON.parse(rawCredentials);
			return credentials.bearer;
		}
		else {
			// we're in production, twitter authorization is an environment variable
			return process.env.TWIITERAUTH;
		}
	}

	function checkTwitterRateLimit(passkey) {
		// set the HTTP headers for a client-based Twitter authorization
		var httpOptions = {
			url: "https://api.twitter.com/1.1/application/rate_limit_status.json",
			method: "GET",
			headers: {
				'Authorization': "Bearer " + passkey
			}
		};

		// make the Twitter API call
		request(httpOptions, function(e, response, body) {
			if (e || response.statusCode != 200) {
				// an error occurred
				// check if the rate limit is the issue
				if (!e && response.statusCode == 429) {
					// ugh, we hit the rate limit's rate limit!
					finalResponse.json(429, {type: 'Rate Limit', subtype: 'Rate Limit'});
				}
				else {
					// some other type of error
					finalResponse.json(403, {type: 'Twitter'});
				}
				return;
			}


			// okay, response was good, let's parse it
			var rateData = JSON.parse(body);
			// get the number of remaining requests and when the rate limit resets
			twitterAPICalls = rateData.resources.statuses['/statuses/show/:id'].remaining;
			twitterAPIReset = rateData.resources.statuses['/statuses/show/:id'].reset;

			// okay, let's start parsing our responses
			initialStorifyRequest();
		});

	}

	function getTweetDetails(id, passkey) {

		// set the HTTP headers for a client-based Twitter authorization
		var httpOptions = {
			url: "https://api.twitter.com/1.1/statuses/show.json?id=" + id,
			method: "GET",
			headers: {
				'Authorization': "Bearer " + passkey
			}
		};

		// make the Twitter API call
		request(httpOptions, function(e, response, body) {

			totalReceivedTweets++;

			if (e || response.statusCode != 200) {
				// an error occurred
				if (!e && response.statusCode == 429) {
					finalResponse.json(429, {type: 'Rate Limit', subtype: 'Tweets'});
				}
				else if (!e && response.statusCode == 404) {
					// tweet no longer exists, skip instead of kill
					if (totalReceivedTweets == totalExpectedTweets) {
						// we're done guys
						processingComplete();
					}
				}
				else {
					finalResponse.send(403, {type: 'Twitter', subtype: response.statusCode});
				}
				return;
			}


			// parse the response
			var tweetData = JSON.parse(body);

			var usableData = {};
			usableData.text = tweetData.text;
			usableData.timestamp = tweetData.created_at;

			// add it to the tweet details array
			tweetDetails[tweetData.id_str] = usableData;


			// now let's check if this is the last request that we're waiting on
			if (totalReceivedTweets == totalExpectedTweets) {
				// we're done guys
				processingComplete();
			}

		});

	}

	function processingComplete() {
		/* okay, we got everything at this point, but we don't want two separate
		associative arrays. let's combine them back into one real array */

		var finalArray = [];

		for (var i = 1; i <= totalPages; i++) {
			// loop through each page and get the elements on that page
			var pageElements = storifyElements[i];
			// loop through each element
			for (var index in pageElements) {
				var currentElement = pageElements[index];

				// find the tweet detail for this element
				var currentTweet = tweetDetails[currentElement.tweetId];

				if (typeof currentTweet != "undefined") {
					// let's combine the Twitter data into the Storify data
					currentElement['text'] = currentTweet.text;
					currentElement['timestamp'] = currentTweet.timestamp;
				}

				// now write it into our final array
				finalArray.push(currentElement);
			}
		}
		/* send the client a response by appending the intial request with the new data.
		this is because Backbone expects the original model returned. */
		configuration.results = finalArray;
		finalResponse.send(200,configuration);
	}


}