/* Rooms */

window.ClientMainRoom = function (app) {
	this.app = app;
	this.id = "_home";
	this.name = "Home";

	this.sendLog = [];
	this.sendLogPos = 0;

	var buf = '';
	buf += '<div class="help-home-div" id="help-home-div">';

	buf += $("#data-div-home-help").html();

	buf += '</div>';
	buf += '<div class="rooms-home-div" id="rooms-home-div">';
	buf += '</div>';
	buf += '<div class="home-chat-div">';
	buf += '<h2 align="center" class="chat-title">Private Chat Terminal</h2>';
	buf += '<div class="chat-container" id="' + this.id + '-chat-container">';
	buf += '<div class="chat-subcontainer" id="' + this.id + '-chat-subcontainer"></div></div>';
	buf += '<div class="chat-area" id="' + this.id + '-chat-area">';
	buf += '<span class="connecting-chatarea">Connecting...</span>';
	buf += '</div>';
	buf += '</div>';

	app.addTab("_home", "<span class=\"ui-icon ui-icon-home\"></span> Home", buf);
};

ClientMainRoom.prototype.send = function (text) {
	this.app.send("@\n" + text);
};

ClientMainRoom.prototype.saveLog = function (text) {
	if (this.sendLogPos > 0) {
		this.sendLog.shift();
		this.sendLogPos = 0;
	}
	this.sendLog.unshift(text);
	if (this.sendLog.length > 20) {
		this.sendLog.pop();
	}
};

ClientMainRoom.prototype.setNotConnected = function () {
	var buf = '';
	buf += '<span class="not-connected-chatarea">You are not connected to the server.</span>';
	buf += '<span class="chatarea-buttons"><button name="reconnect" class="chatarea-button">Reconnect</button></span>';
	$("#" + this.id + '-chat-area').html(buf);
};

ClientMainRoom.prototype.setLoginStatus = function (name, group) {
	var buf = '';
	buf += '<textarea class="chat-textarea" rows="1" id="' + this.id + '-chat-textarea" type="text" autocomplete="off" placeholder="Type here and press Enter to send."></textarea>';
	$("#" + this.id + '-chat-area').html(buf);
	autosize($('#' + this.id + '-chat-textarea'));
	$("#" + this.id + '-chat-textarea').on('keydown', function (event) {
		if (event.which == 13) {
			if (!event.target.value) return;
			this.send(event.target.value);
			this.saveLog(event.target.value);
			event.target.value = "";
			event.preventDefault();
		} else if (event.which == 38) { // Up
			if (this.sendLogPos < (this.sendLog.length - 1)) {
				this.sendLogPos++;
				if (this.sendLogPos === 1) this.sendLog.unshift(event.target.value);
				event.target.value = this.sendLog[this.sendLogPos];
			} else if (this.sendLog.length === 1 && this.sendLogPos === 0) {
				this.sendLogPos = 1;
				this.sendLog.unshift(event.target.value);
				event.target.value = this.sendLog[this.sendLogPos];
			}
			event.preventDefault();
		} else if (event.which == 40) { // Down
			if (this.sendLogPos > 0) {
				this.sendLogPos--;
				event.target.value = this.sendLog[this.sendLogPos];
				if (this.sendLogPos === 0) {
					this.sendLog.shift();
				}
			}
			event.preventDefault();
		} else if (event.which == 9) { //Tab
			var newVal = this.app.completeLine(event.target.value, this);
			if (event.target.value !== newVal) {
				event.target.value = newVal;
			}
			event.preventDefault();
		}
	}.bind(this));
	if (group === "~") {
		this.name = "<span class=\"ui-icon ui-icon-home\"></span> Home - Administrator";
		this.app.changeTabTitleHTML(this.id, this.name);
	} else {
		this.name = "<span class=\"ui-icon ui-icon-home\"></span> Home";
		this.app.changeTabTitleHTML(this.id, this.name);
	}
};

ClientMainRoom.prototype.setRoomsList = function (list) {
	this.room_list = list;
	var buf = "";
	for (var id in list) {
		buf += '<div class="room-joiner">';
		buf += '<button id="join-btn-' + id + '" class="join-btn" name="joinroom" value="' + id + '">' + Tools.escapeHTML(list[id].name) + '</button>';
		buf += '</div>';
	}
	$("#rooms-home-div").html(buf);
};

ClientMainRoom.prototype.add = function (html) {
	var container = $("#" + this.id + "-chat-container");
	var subcontainer = $("#" + this.id + "-chat-subcontainer");
	var mustScroll = container.scrollTop() >= (subcontainer.height() - container.height() - 50);
	subcontainer.append(html);
	if (mustScroll) {
		container.scrollTop(subcontainer.height());
	}
};

ClientMainRoom.prototype.addMsg = function (msg, date) {
	this.add('<div class="chat-msg"><span class="chat-time">' + Tools.getTimeString(date) +
		'</span> ' + msg + '</div>');
};

ClientMainRoom.prototype.addLine = function (msg) {
	this.add('<div class="chat-msg"><div class="chat-line">' + msg + '</div></div>');
};

ClientMainRoom.prototype.addChat = function (name, group, msg, date) {
	this.addMsg('<span class="chat-user-group">' + Tools.escapeHTML(group) + '</span><span class="chat-user-name">' +
		Tools.escapeHTML(name) + '</span><span class="chat-user-separator">: </span><span class="chat-user-msg">' +
		Tools.parseChatMsg(msg) + '</span>', date);
};

window.AuctionRoom = function (app, id) {
	this.app = app;
	this.id = id;
	this.name = id;

	this.users = {};
	this.auction = {};

	this.status = 0;
	this.nominated = "";
	this.nominatedTeam = "";
	this.nominatedCost = 0;
	this.timeout = 0;
	this.timer = null;

	this.modchat = 0;

	this.sendLog = [];
	this.sendLogPos = 0;

	this.selectedPlayers = {};

	var buf = '';
	//buf += '<td class="chat-td" width="55%">';
	buf += '<div id="single-room-tabs-' + this.id + '" class="single-room-tabs">';

	/* Tabs */

	buf += '<ul>';
	buf += '<li><a href="#tab-auction-' + this.id + '">Auction</a></li>';
	buf += '<li><a href="#tab-teams-' + this.id + '">Teams</a></li>';
	buf += '<li><a href="#tab-players-' + this.id + '">Players</a></li>';
	buf += '<li><a href="#tab-users-' + this.id + '">Users</a></li>';
	buf += '</ul>';
	buf += '<div id="tab-auction-' + this.id + '" class="room-tab-option room-auction-status"></div>';
	buf += '<div id="tab-teams-' + this.id + '" class="room-tab-option"></div>';
	buf += '<div id="tab-players-' + this.id + '" class="room-tab-option"></div>';
	buf += '<div id="tab-users-' + this.id + '" class="room-tab-option"></div>';

	buf += '</div>';
	/* Public chat */
	buf += '<div class="room-chat-div">';
	buf += '<h2 align="center" class="chat-title">Public Chat</h2>';
	buf += '<div class="chat-container" id="' + this.id + '-chat-container">';
	buf += '<div class="chat-subcontainer" id="' + this.id + '-chat-subcontainer"></div></div>';
	buf += '<div class="chat-area" id="' + this.id + '-chat-area">';
	buf += '<span class="not-connected-chatarea">You are not connected to the server.</span>';
	buf += '</div>';
	buf += '</div>';

	app.addTab(this.id, this.id, buf);

	this.tabs = $("#single-room-tabs-" + this.id).tabs();
	this.tabs.tabs('disable', 4);

	//$(".room-config-group").controlgroup();

	$("#room-close-button-" + this.id).on("click", function () {
		this.app.home_room.send("/leave " + this.id);
	}.bind(this));
};

AuctionRoom.prototype.setRoomName = function (name) {
	this.name = name;
	this.app.changeTabTitle(this.id, this.name);
};

AuctionRoom.prototype.send = function (text) {
	this.app.send(this.id + "\n" + text);
};

AuctionRoom.prototype.saveLog = function (text) {
	if (this.sendLogPos > 0) {
		this.sendLog.shift();
		this.sendLogPos = 0;
	}
	this.sendLog.unshift(text);
	if (this.sendLog.length > 20) {
		this.sendLog.pop();
	}
};

AuctionRoom.prototype.setNotConnected = function () {
	var buf = '';
	buf += '<span class="not-connected-chatarea">You are not connected to the server.</span>';
	buf += '<span class="chatarea-buttons"><button name="reconnect" class="chatarea-button">Reconnect</button></span>';
	$("#" + this.id + '-chat-area').html(buf);
};

AuctionRoom.prototype.setLoginStatus = function (name) {
	var buf = '';
	buf += '<textarea class="chat-textarea" rows="1" id="' + this.id + '-chat-textarea" type="text" size="70" autocomplete="off" placeholder="Type here and press Enter to send."></textarea>';
	$("#" + this.id + '-chat-area').html(buf);
	autosize($('#' + this.id + '-chat-textarea'));
	$("#" + this.id + '-chat-textarea').on('keydown', function (event) {
		if (event.which == 13) {
			if (!event.target.value) return;
			this.send(event.target.value);
			this.saveLog(event.target.value);
			event.target.value = "";
			event.preventDefault();
		} else if (event.which == 38) { // Up
			if (this.sendLogPos < (this.sendLog.length - 1)) {
				this.sendLogPos++;
				if (this.sendLogPos === 1) this.sendLog.unshift(event.target.value);
				event.target.value = this.sendLog[this.sendLogPos];
			} else if (this.sendLog.length === 1 && this.sendLogPos === 0) {
				this.sendLogPos = 1;
				this.sendLog.unshift(event.target.value);
				event.target.value = this.sendLog[this.sendLogPos];
			}
			event.preventDefault();
		} else if (event.which == 40) { // Down
			if (this.sendLogPos > 0) {
				this.sendLogPos--;
				event.target.value = this.sendLog[this.sendLogPos];
				if (this.sendLogPos === 0) {
					this.sendLog.shift();
				}
			}
			event.preventDefault();
		} else if (event.which == 9) { //Tab
			var newVal = this.app.completeLine(event.target.value, this);
			if (event.target.value !== newVal) {
				event.target.value = newVal;
			}
			event.preventDefault();
		}
	}.bind(this));
};

AuctionRoom.prototype.add = function (html) {
	var container = $("#" + this.id + "-chat-container");
	var subcontainer = $("#" + this.id + "-chat-subcontainer");
	var mustScroll = container.scrollTop() >= (subcontainer.height() - container.height() - 50);
	subcontainer.append(html);
	if (mustScroll) {
		container.scrollTop(subcontainer.height());
	}
};

AuctionRoom.prototype.addMsg = function (msg, date) {
	this.add('<div class="chat-msg"><span class="chat-time">' + Tools.getTimeString(date) +
		'</span> ' + msg + '</div>');
};

AuctionRoom.prototype.addLine = function (msg) {
	this.add('<div class="chat-msg"><div class="chat-line">' + msg + '</div></div>');
};

AuctionRoom.prototype.addChat = function (name, group, msg, date) {
	this.addMsg('<span class="chat-user-group">' + Tools.escapeHTML(group) + '</span><span class="chat-user-name">' +
		Tools.escapeHTML(name) + '</span><span class="chat-user-separator">: </span><span class="chat-user-msg">' +
		Tools.parseChatMsg(msg) + '</span>', date);
};

AuctionRoom.prototype.userName = function (id) {
	id = Tools.toId(id);
	if (this.users[id]) {
		return this.users[id].name;
	} else {
		return id;
	}
};

AuctionRoom.prototype.updateAuctionTab = function () {
	var team, players, html = "";
	if (this.timer) {
		clearInterval(this.timer);
		this.timer = null;
	}
	switch (this.status) {
	case 0:
		team = this.auction.teams[this.auction.turn];
		if (team) {
			html += '<h3>' + Tools.escapeHTML(team.name) + ' has the turn for nominating</h3>';
			if (team.captains[this.app.currUser.id]) {
				if (this.getFreePlayers().length > 0) {
					html += '<p><button class="auction-button" name="nominate" value="' + this.id + '">Nominate a Player</button></p>';
					if (this.getPlayersByTeam(this.auction.turn).length >= this.auction.config.minplayers) {
						html += '<p><button class="auction-button" name="pass" value="' + this.id + '">Pass the turn</button></p>';
					}
				} else {
					html += '<p><b>There are no more players to nominate.</b></p>';
				}
			}
		} else {
			html += '<h3>Waiting for a room manager to set the initial turn</h3>';
		}
		break;
	case 1:
		html += '<h3>' + Tools.escapeHTML(this.playerName(this.nominated)) + ' has been nominated</h3>';
		html += '<h4>' + Tools.escapeHTML(this.teamName(this.nominatedTeam)) + ' has the highest bid: ' +
				Tools.escapeHTML(this.nominatedCost) + 'K</h4>';
		team = this.getTeamByCaptain(this.app.currUser.id);
		if (team) {
			html += '<p><button class="auction-button" name="bid" value="' + this.id + '"' +
					(team.id === this.nominatedTeam ? "disabled" : "") + '>Offer ' +
					Tools.escapeHTML(this.nominatedCost + 0.5) + 'K</button></p>';
			html += '<p>Use <b>/bid X</b> to offer a custom amount.</p>';
		}
		html += '<p class="timer-msg"><span class="timer-mark" id="' + this.id + '-timer-mark">99 seconds left</span>.</p>';
		this.timer = setInterval(function () {
			var l = Math.floor((this.timeout - (Date.now() - this.app.timeoffset)) / 1000);
			if (l <= 0) {
				$("#" + this.id + "-timer-mark").html("Waiting...");
			} else {
				$("#" + this.id + "-timer-mark").html(l + " second" + (l === 1 ? "" : "s") + " left");
			}
		}.bind(this), 1000);
		break;
	default:
		html += '<p>Waiting...</p>';
	}
	if (this.users[this.app.currUser.id] && this.users[this.app.currUser.id].group in {"#": 1, "~": 1}) {
		html += '<hr />';
		html += '<div class="auction-configuration-controls">';
		html += '<button class="config-button" name="changeconfig" value="' + this.id + '"' +
			(this.status === 0 ? "" : " disabled") + '>Change Auction Configuration</button>';
		html += '</div>';
	}
	$("#tab-auction-" + this.id).html(html);
	if (this.status === 1) {
		var l = Math.floor((this.timeout - (Date.now() - this.app.timeoffset)) / 1000);
		if (l <= 0) {
			$("#" + this.id + "-timer-mark").html("Waiting...");
		} else {
			$("#" + this.id + "-timer-mark").html(l + " second" + (l === 1 ? "" : "s") + " left");
		}
	}
};

AuctionRoom.prototype.updateUsersTab = function () {
	var nUsers = 0;
	var groups = {
		admin: {sym: "~", u: [], n: "Administrator"},
		manager: {sym: "#", u: [], n: "Room Manager"},
		mod: {sym: "@", u: [], n: "Moderator"},
		participant: {sym: "%", u: [], n: "Auction Participant"},
		user: {sym: "+", u: [], n: "Regular User"}
	};
	for (var id in this.users) {
		nUsers++;
		for (var k in groups) {
			if (groups[k].sym !== this.users[id].group) continue;
			groups[k].u.push(Tools.escapeHTML(this.users[id].name));
		}
	}

	var html = '<h2 align="center">Online Users (' + nUsers + ')</h2>';
	html += '<table border="0" class="users-table">';
	html += '<tr class="table-title"><td>&nbsp;</td><td><b>User Name</b></td><td><b>Group Name</b></td></tr>';
	for (var k in groups) {
		if (groups[k].u.length === 0) continue;
		var users = groups[k].u.sort();
		for (var i = 0; i < users.length; i++) {
			html += '<tr>';
			html += '<td align="center"><b>' + Tools.escapeHTML(groups[k].sym) + '</b></td>';
			html += '<td>' + users[i] + '</td>';
			html += '<td>' + groups[k].n + '</td>';
			html += '</tr>';
		}
	}
	html += '</table>';
	$("#tab-users-" + this.id).html(html);
};

AuctionRoom.prototype.updatePlayersTab = function () {
	var html = '';
	var players = this.getPlayers();
	if (this.users[this.app.currUser.id] && this.users[this.app.currUser.id].group in {"#": 1, "~": 1}) {
		html += '<div class="auction-players-control">';
		/*html += '<p><textarea class="config-textarea" id="' + this.id +
			'-room-players-textarea" placeholder="Player1, Player2, Player3, ..."></textarea></p>';*/
		html += '<button class="config-button" name="rmplayers" value="' + this.id + '">Remove Selected Players</button>' +
			'<button class="config-button" name="addplayers" value="' + this.id + '">Add Players</button>';
		html += '</div>';
		html += '<hr />';
	}
	html += '<table border="0" class="players-table">';
	html += '<tr class="table-title"><td>&nbsp;</td><td><b>Player</b></td><td><b>Team</b></td><td><b>Cost</b></td></tr>';
	for (var i = 0; i < players.length; i++) {
		var id = Tools.toPlayerId(players[i]);
		html += '<tr>';
		html += '<td><input type="checkbox" name="select-player-checkbox" value="' + this.id + '|' + id + '" ' +
			(this.selectedPlayers[id] ? 'checked="checked" ' : '') + '/></td>';
		html += '<td>' + Tools.escapeHTML(this.playerName(id)) + '</td>';
		if (this.auction.players[id].team) {
			html += '<td>' + Tools.escapeHTML(this.teamName(this.auction.players[id].team)) + '</td>';
			html += '<td>' + Tools.escapeHTML(this.auction.players[id].cost) + 'K</td>';
		} else {
			html += '<td> - </td>';
			html += '<td> - </td>';
		}
		html += '</tr>';
	}
	html += '</table>';

	$("#tab-players-" + this.id).html(html);
};

AuctionRoom.prototype.updateTeamsTab = function () {
	var html = '<h2 align="center">Auction Teams</h2>';
	var players, captains;

	if (this.users[this.app.currUser.id] && this.users[this.app.currUser.id].group in {"#": 1, "~": 1}) {
		html += '<div class="auction-teams-control">';
		html += '<button class="config-button" name="addteam" value="' + this.id + '">Register New Team</button>';
		html += '</div>';
	}

	for (var id in this.auction.teams) {
		players = this.getPlayersByTeam(id);
		captains = [];
		for (var c in this.auction.teams[id].captains) {
			captains.push(c);
		}

		html += '<div class="team-widget">';
		html += '<h3>' + this.auction.teams[id].name + '</h3>';
		html += '<h4>Money: ' + this.auction.teams[id].money + 'K</h4>';
		html += '<hr />';
		html += '<h4>Captains</h4>';
		html += '<p>' + (Tools.escapeHTML(captains.join(", ")) || '<i>(none)</i>') + '</p>';
		html += '<hr />';
		html += '<h4>Players (' + players.length + ')</h4>';
		html += '<p>' + (Tools.escapeHTML(players.join(", ")) || '<i>(none)</i>') + '</p>';
		if (this.users[this.app.currUser.id] && this.users[this.app.currUser.id].group in {"#": 1, "~": 1}) {
			html += '<hr />';
			html += '<div class="auction-teams-control">';

			html += '<button class="config-button" name="setturn" value="' + this.id + '|' + id + '"' +
				(this.auction.turn === id ? " disabled" : "") + '>Give Turn</button>';
			html += '<button class="config-button" name="assignplayer" value="' + this.id + '|' + id + '"' +
				(this.getFreePlayers().length === 0 ? " disabled" : "") + '>Add Player</button>';
			html += '<button class="config-button" name="setfreeplayer" value="' + this.id + '|' + id + '"' +
				(this.getPlayersByTeam(id).length === 0 ? " disabled" : "") + '>Remove Player</button>';
			html += '<button class="config-button" name="setcaptain" value="' + this.id + '|' + id + '">Add Captain</button>';
			html += '<button class="config-button" name="rmcaptain" value="' + this.id + '|' + id + '"' +
				(this.getCaptainsByTeam(id).length === 0 ? " disabled" : "") + '>Remove Captain</button>';
			html += '<button class="config-button" name="setmoney" value="' + this.id + '|' + id + '">Set Money</button>';
			html += '<button class="config-button-danger" name="deleteteam" value="' + this.id + '|' + id + '">Delete Team</button>';
			html += '</div>';
		}
		html += '</div>';
	}

	$("#tab-teams-" + this.id).html(html);
};
