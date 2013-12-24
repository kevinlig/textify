var express = require('express');
var app = express();

var exphbs = require('express3-handlebars');

app.set("view engine",".html");
app.engine(".html",exphbs({
	defaultLayout: 'main', 
	extname:'.html'}));

app.use(express.static('public'));

app.use(express.bodyParser());

app.get('/',function(req,res) {
	// home screen
	res.render('partials/mainpage');
});


// for development only: read from a stored JSON instead of using our Twitter rate-limited calls
// app.post('/fetchStory2',function(req,res) {
// 	var referenceJson = require('fs').readFileSync('./public/reference.json','utf8');
// 	res.send(200,referenceJson);
//});

// reference the storify fetching module
require('./controllers/fetchStory')(app);

var port = process.env.PORT || 3000;
app.listen(port);

console.log("Server started on port " + port);