// extend express' routing
var superagent = require('superagent');

module.exports = function(app) {
	app.post("/fetchStory", function(req,res) {
		var configOptions = req.body;
		var success = true;
		superagent.get("http://api.storify.com/v1/stories/" + configOptions.feedUser
			+ "/" + configOptions.feedStory)
			.end(function(e, res) {
				if (res.status == 200) {
					// good response
					parseStorify(res.body);
				}
				else {
					// error occurred
					success = false;
				}
			});

		if (success == true) {
			res.send(200);
		}
		else {
			console.log("this");
			res.send(500);
		}
	});

	function parseStorify(data) {
		
	}

}