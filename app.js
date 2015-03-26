var express = require("express");
var app = express();
var request = require('request');

app.use(express.static("public"));


app.get('/session/:roomId', function (req, res){
	res.sendFile(__dirname + '/views/index.html');
});

app.get('/', function (req, res){
	var max = 65535, min = 0;

	roomId = Math.floor(Math.random() * (max - min + 1)) + min;
	res.redirect('/session/' + roomId);
});


var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var host = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var server = app.listen(port, host, function(){
	console.log( 'Listening on http://%s:%s...', host, port);
});

var rooms = [];
var io = require('socket.io')(server);
io.on('connection', function(socket){
	console.log('New user connected');

	socket.on('disconnect', function(){
		console.log('User disconnected');
	});

	socket.on('register', function(roomId){
		socket.room = {
			id: roomId
		};

		socket.join(roomId);
		console.log('Room id: %s is registered', roomId);
	});

	socket.on('command', function(command){
		switch(command.act){
			case 'play':
				console.log('Room %s play', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'play'});
				break;
			case 'pause':
				console.log('Room %s pause', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'pause'});
				break;
			case 'stop':
				console.log('Room %s stop', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'stop'});
				break;
			case 'rewind':
				console.log('Room %s rewind', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'rewind'});
				break;
			case 'previous':
				console.log('Room %s previous', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'previous'});
				break;
			case 'next':
				console.log('Room %s next', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'next'});
				break;
			case 'fast-forward':
				console.log('Room %s fast-forward', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'fast-forward'});
				break;
			case 'mute':
				console.log('Room %s mute', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'mute'});
				break;	
			case 'unmute':
				console.log('Room %s unmute', socket.room.id);
				io.to(socket.room.id).emit('command', {act: 'unmute'});
				break;	
			case 'select':
				console.log('Room %s select %s', socket.room.id, command.vid);
				io.to(socket.room.id).emit('command', {act: 'select', vid: command.vid});				
		}
	});

	socket.on('add', function(vid){
		console.log('Room %s add video: [%s]', socket.room.id, vid);

		var url = 'http://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=' + vid;
		request(url, function (err, res, body){
			if (!err && res.statusCode == 200){
				var title = JSON.parse(body).title;
				console.log(title);
				io.to(socket.room.id).emit('add', {title: title, vid: vid});
			} else {
				console.log('Room %s Failed to add item: [%s], err = %s', socket.room.id, vid, err);
			};
		});
	});

	socket.on('remove', function(index){
		console.log('Room %s remove video: [%s]', socket.room.id, index);

		io.to(socket.room.id).emit('remove', index);
	});

	socket.on('clear', function(){
		console.log('Room %s clear playlist', socket.room.id);

		io.to(socket.room.id).emit('clear');
	});

	socket.on('sync', function(){
		console.log('Room %s sent a sync request', socket.room.id);

		var clients = io.sockets.adapter.rooms[socket.room.id];
		var keys = Object.keys(clients);

		//console.log(clients);

		if (keys.length >= 1){
			console.log('Send Upload request to room %s', socket.room.id);

			var uploader = io.sockets.connected[keys[0]];
			if (uploader){
				uploader.emit('upload');
			}
		} else {

		}
	});

	socket.on('upload', function(playlist, active){
		console.log('Room %s upload playlist', socket.room.id);

		io.to(socket.room.id).emit('download', playlist, active);
	});


});













