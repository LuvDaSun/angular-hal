/* jshint node: true */

var connect = require('connect');
var http = require('http');
var path = require('path');

var app = connect()
    .use(connect.logger('dev'))
	.use(connect.favicon())
    .use('/bower_components', connect.static(path.resolve(__dirname, '../bower_components')))
    .use('/bower_components/angular-hal', connect.static(path.resolve(__dirname, '..')))
    .use(connect.static(path.resolve(__dirname, './src')));

http.createServer(app).listen(8080);