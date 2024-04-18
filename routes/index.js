var http = require('http');
var axios = require('axios');
var cache = {};
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/data.db');

exports.art = function(req, res){
	var url = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';
	if (cache[url]) {
		res.render('art', { title: 'Art Gallery', art: cache[url] });
	} else {
		axios.get(url)
			.then(function (response) {
				cache[url] = response.data;
				res.render('art', { title: 'Art Gallery', art: response.data });
			})
			.catch(function (error) {
				console.log(error);
			});
	}
};

exports.art_ADMIN = function(req, res){
	var url = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';
	if (cache[url]) {
		res.render('art', { title: 'Art Gallery', art: cache[url] });
	} else {
		axios.get(url)
			.then(function (response) {
				cache[url] = response.data;
				res.render('art_ADMIN', { title: 'Art Gallery', art: response.data });
			})
			.catch(function (error) {
				console.log(error);
			});
	}
};

exports.search = function(req, res){
	var query = req.query.q;
	var url = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&isHighlight=true&q=${query}`;
	if (cache[url]) {
		var artObjects = cache[url];
		res.render('search', { title: 'Search Results', art: artObjects });
	} else {
		axios.get(url)
			.then(function (response) {
				if (response.data.objectIDs) {
					var objectIDs = response.data.objectIDs.slice(0, 25);
					var objectPromises = objectIDs.map(id => axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`));
					return Promise.all(objectPromises);
				} else {
					res.render('search', { title: 'Search Results', message: 'No results found for your query.' });
				}
			})
			.then(function (responses) {
				if (responses) {
					var artObjects = responses.map(response => response.data);
					cache[url] = artObjects;
					res.render('search', { title: 'Search Results', art: artObjects });
				}
			})
			.catch(function (error) {
				console.log(error);
			});
	}
};

exports.users = function(req, res){
	db.all('SELECT * FROM users', function(err, rows){
		if(err) {
			console.error(err);
			res.status(500).send('Error on the server.');
		} else {
			res.render('users', { title: 'Users', users: rows });
		}
	});
}

exports.favorite = function(req, res){
	var username = req.cookies.username;
	var objectID = req.body.objectID;

	console.log('username:', username);
	console.log('objectID:', objectID);

	db.get('SELECT * FROM favorites WHERE username = ? AND objectID = ?', [username, objectID], function(err, row){
		if(err) {
			console.error(err);
			res.status(500).send('Error on the server.');
		} else if(row) {
			res.status(200).send('Art object is already favorited.');
		} else {
			db.run('INSERT INTO favorites (username, objectID) VALUES (?, ?)', [username, objectID], function(err){
				if(err) {
					console.error(err);
					res.status(500).send('Error on the server.');
				} else {
					res.status(200).send('Art object favorited successfully.');
				}
			});
		}
	});
};

exports.favourites = function(req, res){
	var username = req.cookies.username;
	db.all('SELECT * FROM favorites WHERE username = ?', [username], function(err, rows){
		if(err) {
			console.error(err);
			res.status(500).send('Error on the server.');
		} else {
			var favouritesPromises = rows.map(row => axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${row.objectID}`));
			Promise.all(favouritesPromises)
				.then(function(responses) {
					var favourites = responses.map(response => response.data);
					res.render('favourites', { title: 'Favourites', favourites: favourites });
				})
				.catch(function(error) {
					console.error(error);
					res.status(500).send('Error on the server.');
				});
		}
	});
};


exports.login = function(req, res){

	res.clearCookie('username');
	res.clearCookie('password');

	var username = req.body.username;
	var password = req.body.password;

	res.cookie('username', username, { maxAge: 900000, httpOnly: true });
	res.cookie('password', password, { maxAge: 900000, httpOnly: true });

	db.get('SELECT * FROM users WHERE username = ?', [username], function(err, row){
		if(err) {
			res.status(500).send('Error on the server.');
		} else if(row) {
			if(row.password == password) {
				res.redirect('http://localhost:3000/art');
			} else {
				res.status(401).send('Incorrect password');
			}
		} else {
			db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(insertErr){
				if(insertErr) {
					res.status(500).send('Error on the server.');
				} else {
					res.redirect('http://localhost:3000/art');
				}
			});
		}
	});
};
