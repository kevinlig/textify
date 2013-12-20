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

// reference the storify fetching module
require('./controllers/fetchStory')(app);

var port = process.env.PORT || 3000;
app.listen(port);

console.log("Server started on port " + port);