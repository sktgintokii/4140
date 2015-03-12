var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var socket;
var player;
var playlist = (function(){
	var p = localStorage.getItem('playlist');
	if (!p) {
		localStorage.setItem('playlist', JSON.stringify({'playlist': []}));
		return [];
	} else {
		return JSON.parse(p).playlist;
	}
}) ();
var roomId;

socket = io();
var re = /(\/session\/)([0-9]{5})/;
roomId = re.exec(document.location.pathname)[2];


socket.emit('register', roomId);
socket.emit('sync');

socket.on('command', function(command){
	switch(command.act){
		case 'play':
			player.playVideo();
			break;
		case 'pause':
			player.pauseVideo();	
			break;
		case 'stop':
			player.stopVideo();
			break;
		case 'rewind':
			var currentTime = player.getCurrentTime();
			player.seekTo(currentTime - 2.0);
			break;
		case 'previous':
			var item = document.querySelector("#playlist > a.active");
			break;
		case 'next':
			break;
		case 'fast-forward':
			var currentTime = player.getCurrentTime();
			player.seekTo(currentTime + 2.0);
			break;
		case 'mute':
			player.mute();
			break;	
		case 'unmute':
			player.unMute();
			break;							
	}
});

socket.on('add', function(item){
	addItemToPlaylist(item.title, item.vid);
	playlist.push({vid: item.vid, title: item.title});
	setPlaylistStorage(playlist);
});

socket.on('remove', function(index){
	var list = document.querySelectorAll("#playlist > a");
	document.querySelector("#playlist").removeChild(list[index]);
});

socket.on('clear', function(){
	var node = document.querySelector("#playlist");
	while (node.firstChild) {
	    node.removeChild(node.firstChild);
	}

	playlist = [];
	setPlaylistStorage(playlist);
});

socket.on('upload', function(){
	socket.emit('upload', playlist);
	console.log('upload', playlist);
});

socket.on('download', function(data){
	console.log('download', data);
	playlist = data;
	setPlaylistStorage(playlist);

	var node = document.querySelector("#playlist");
	node.innerHTML = '';
	playlist.forEach(function(video){
		addItemToPlaylist(video.title, video.vid);
	});
});

function onYouTubeIframeAPIReady() {
	var vid = (function(){
		if (playlist.length > 0){
			return playlist[0].vid;
		} else {
			return null;
		}
	})();

	player = new YT.Player('player', {
		height: '390',
		width: '640',
		playerVars: {'controls': 0},
		videoId: vid,
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

function onPlayerReady(e) {
}

function onPlayerStateChange(e) {

}

function setPlaylistStorage(playlist){
	localStorage.setItem('playlist', JSON.stringify({'playlist': playlist}));
}

function playVideo(){
	socket.emit('command', {act: 'play'});
}

function pauseVideo(){
	socket.emit('command', {act: 'pause'});
}

function stopVideo(){
	socket.emit('command', {act: 'stop'});
}

function fastForwardVideo(){
	socket.emit('command', {act: 'fast-forward'});
}

function rewindVideo(){
	socket.emit('command', {act: 'rewind'});
}

function muteVideo(){
	socket.emit('command', {act: 'mute'});
}

function unmuteVideo(){
	socket.emit('command', {act: 'unmute'});
}

function selectVideo(e){
	e.preventDefault();
	player.loadVideoById(this.getAttribute("data-vid"));
	

	var parent = this.parentNode;
	var list = parent.querySelectorAll('a.active');
	for (var i = 0; i < list.length; i++){
		list[i].className = list[i].className.replace(/\bactive\b/,'');
	}
	this.className += ' active';
}

function removeVideo(e){
	e.preventDefault();
	e.stopPropagation();

	var index;
	var list = document.querySelectorAll("#playlist > a");
	for (var i = 0; i < list.length; i++){
		if (list[i] === this.parentNode){
			index = i;
		}
	}

	socket.emit('remove', index);
}


function addPlaylist(e){
	var vid = document.querySelector("#playlist-vid-input").value;
	socket.emit('add', vid);
	e.preventDefault();
}

function addItemToPlaylist(title, vid){
	var btn = document.createElement("span");
	btn.innerHTML = '<i class="fa fa-times-circle"></i>';
	btn.className = "pull-right remove-playlist-btn";
	btn.addEventListener("click", removeVideo);

	var a = document.createElement("a");
	a.setAttribute("href", "#");
	a.setAttribute("data-vid", vid);
	a.setAttribute("data-title", title);
	a.className = "list-group-item";
	a.innerHTML = title;
	a.addEventListener("click", selectVideo);

	a.appendChild(btn);

	document.querySelector("#playlist").appendChild(a);
	document.querySelector("#playlist-vid-input").value = "";
}

function clearPlaylist(){
	socket.emit('clear');	
}

function addListeners(){
	window.addEventListener("resize", function(){
		if (window.innerWidth >= 992){
			if (player === null){
				onYouTubeIframeAPIReady();
			}
		} else {
			player.destroy();
			player = null;
		}
	});

	document.querySelector("#play-btn").addEventListener("click", playVideo);
	document.querySelector("#pause-btn").addEventListener("click", pauseVideo);
	document.querySelector("#stop-btn").addEventListener("click", stopVideo);

	document.querySelector("#fast-forward-btn").addEventListener("click", fastForwardVideo);
	document.querySelector("#rewind-btn").addEventListener("click", rewindVideo);

	document.querySelector("#mute-btn").addEventListener("click", muteVideo);
	document.querySelector("#unmute-btn").addEventListener("click", unmuteVideo);

	// playlist controll
	var btns = document.querySelectorAll(".remove-playlist-btn");
	for (var i = 0; i < btns.length; i++){
		btns[i].addEventListener("click", removeVideo);
	}

	document.querySelector("#add-playlist-btn").addEventListener("click", addPlaylist);
	document.querySelector("#clear-playlist-btn").addEventListener("click", clearPlaylist);

	var list = document.querySelectorAll("#playlist > a");
	for (var i = 0; i < list.length; i++){
		list[i].addEventListener("click", selectVideo);
	};
}

function addQRCode(){
	var qrcode = document.querySelector("#qrcode");
	var url = 'https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=' + encodeURIComponent(window.location.href);
	var content = '<img src="' + url + '" />';
	qrcode.innerHTML += (content);
}

// Equivalent to $(document).ready()
document.addEventListener("DOMContentLoaded", function(){
	addListeners();
	addQRCode();
});




