var express = require('express');
var app = express();

var exphbs = require('express3-handlebars');

app.set("view engine",".html");
app.engine(".html",exphbs({
	defaultLayout: 'main', 
	extname:'.html'}));

app.use(express.static('public'));

app.get('/',function(req,res) {
	// home screen
	res.render('partials/mainpage');
});

var port = process.env.PORT || 3000;
app.listen(port);

console.log("Listening on port " + port);