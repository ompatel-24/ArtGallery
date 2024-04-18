var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var http = require('http');
var socketio = require('socket.io');
var app = express();
var server = http.createServer(app); // Create server with http module
var io = socketio(server); // Attach Socket.IO to server
var db = new sqlite3.Database('./data/data.db');
var cookieparser = require('cookie-parser');

const PORT = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieparser());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs'); //use hbs handlebars wrapper

app.locals.pretty = true;

db.serialize(function(){
	db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)'); // Create users table
	db.run('CREATE TABLE IF NOT EXISTS favorites (username TEXT, objectID INTEGER)'); // Create favorites table
})

//read routes modules
var routes = require('./routes/index');

app.get('/art', routes.art);
app.get('/art_ADMIN', routes.art_ADMIN);
app.get('/favourites', routes.favourites);
app.get('/users', routes.users);
app.get('/search', routes.search);
app.get('/login', function(req, res) {
	res.render('login');
});
app.post('/login', routes.login); // Changed from app.get to app.post
app.post('/favorite', routes.favorite); // Add favorite route

server.listen(PORT, err => {
	if(err) console.log(err)
	else {
		console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
		console.log('(http://localhost:3000/login)')
	}
})

// exports.login = function(req, res){
// 	var username = req.body.username;
// 	var password = req.body.password;
//
// 	db.get('SELECT * FROM users WHERE username = ?', [username], function(err, row){
// 		if(err) {
// 			res.status(500).send('Error on the server.');
// 		} else if(row) {
// 			if(row.password == password) {
// 				res.redirect('http://localhost:3000/search');
// 			} else {
// 				res.status(401).send('Incorrect password');
// 			}
// 		} else {
// 			db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(insertErr){
// 				if(insertErr) {
// 					res.status(500).send('Error on the server.');
// 				} else {
// 					res.redirect('http://localhost:3000/search');
// 				}
// 			});
// 		}
// 	});
// };
