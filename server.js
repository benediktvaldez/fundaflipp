var http = require('http');
var path = require('path');
var fs = require('fs');
var less = require('less');

var port = 1337;
var folder = '/html';
var compressCss = true;

http.createServer(function (req, res) {
	var filePath = '.'+ folder + req.url;
	var contentType = getMimeType(path.extname(req.url));

	if(filePath == '.'+ folder +'/')
		filePath = './'+ folder +'/index.html';

	fs.exists(filePath, function(exists) {
		if(exists){
			fs.readFile(filePath, function(error, content) {
				if(error) {
					res.writeHead(500);
					res.end();
				} else {
					if(path.extname(req.url) == ".less") {
						compileLessFile(filePath, function(err, str){
							if(err){
								res.writeHead(500);
								res.end();
								return;
							}

							res.writeHead(200, {
								'Content-Length': str.length,
								'Content-Type': 'text/css'
							});
							res.end(str);
						});
					} else {
						res.writeHead(200, { 'Content-Type': contentType });
						res.end(content, 'utf-8');
					}
				}
			});
		} else {
			res.writeHead(404, { 'Content-Type': contentType });
			res.write('<strong>'+ req.url +'</strong> not found');
			res.end();
		}
	});
}).listen(port);

var compileLessFile = function(url, callback){

	var fileRead = function(exists){
		if(!exists){
			callback(new Error('File does not exists'));
			return;
		}

		fs.readFile(url, 'utf-8', function (err, str) {
			if(err){
				callback(err);
			}

			compileLess(str);
		});
	};

	var compileLess = function(str){
		var parser = new(less.Parser)({
			paths: [path.dirname(url)],
			optimization: 0
		});

		parser.parse(str, function (err, tree) {
			if (err) {
				callback(err);
				return;
			}

			try {
				callback(null, tree.toCSS({ compress: compressCss }));
			} catch (e) {
				callback(e);
			}
		});
	};

	fs.exists(url, fileRead);
};

var getMimeType = function(ext){
	switch(ext){
		case '.ico':
			return 'image/x-icon';
		case '.jpg':
		case '.jpeg':
			return 'image/jpeg';
		case '.png':
			return 'image/png';
		case '.js':
			return 'text/javascript';
		case '.json':
			return 'application/json';
		case '.css':
		case '.less':
			return 'text/css';
		case '.html':
			return 'text/html';
	}
};

console.log('Server running at http://127.0.0.1:'+ port +'/');
