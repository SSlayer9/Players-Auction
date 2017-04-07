/**
 * Players Auction Client
 */

function Client(maindiv) {
	this.maindiv = maindiv;
	this.socket = null;
	this.connected = false;
	this.timeoffset = 0;

	this.currUser = {
		id: "",
		name: "",
		guest: true,
		group: " ",
	};

	/* Tabs */
	this.maindiv.append("<div id=\"main-tabs\"><ul id=\"main-tabs-ul\"></ul></div>");
	this.maintabs = $("#main-tabs").tabs();
	this.maintabs.find(".ui-tabs-nav").sortable({
		axis: "x",
		stop: function () {
			this.maintabs.tabs("refresh");
		}.bind(this)
	});

	this.maintabs.on("click", "span.ui-icon-close", function (event) {
		var panelId = $(event.target).closest("li").attr("aria-controls");
		this.removeTab(panelId);
	}.bind(this));

	/* Alert Dialog */

	this.maindiv.append("<div id=\"alert-msg\" title=\"Alert Message\"><p id=\"alert-msg-txt\"></p></div>");
	this.alertsdialog = $("#alert-msg").dialog({
		autoOpen: false,
		resizable: false,
		height: "auto",
		width: 500,
		modal: false,
		buttons: {
			"Ok": function () {
				this.alertsdialog.dialog("close");
			}.bind(this)
		}
	});

	/* Login Dialog */

	this.maindiv.append('<div id="login-dialog" title="Login"><form><p><span class="field-name">Username: </span>' +
		'<input type="text" name="user" id="login-dialog-user" value="" class="login-text-field"></p>' +
		'<p><span class="field-name">Password: </span><input type="password" name="pass" id="login-dialog-pass" value="" class="pass-text-field">' +
		'</p></form><p><span class="dialog-error-msg" id="login-dialog-error-msg"></span></p></div>');
	this.logindialog = $("#login-dialog").dialog({
		autoOpen: false,
		resizable: false,
		height: "auto",
		width: "auto",
		modal: false,
		buttons: {
			"Login": {
				text: "Login",
				id: "login-dialog-button",
				click: function () {
					var res = this.logindialog.checkLoginFunc();
					if (res) {
						$("#login-dialog-error-msg").html(res);
					} else {
						this.logindialog.dialog("close");
						this.home_room.send("/login " + $("#login-dialog-user").prop("value") + "," + $("#login-dialog-pass").prop("value"));
						$("#login-dialog-pass").prop("value", "");
					}
				}.bind(this)
			}
		}
	});
	this.logindialog.checkLoginFunc = function () {
		var txt = $("#login-dialog-user").prop("value") || "";
		if (txt.length === 0 || txt.length > 25 || Tools.toId(txt).length === 0 || Tools.toId(txt).length > 20 ||
																								(/[\|,]+/g).test(txt)) {
			return "Invalid nickname.";
		} else {
			txt = $("#login-dialog-pass").prop("value") || "";
			if (txt.length === 0) {
				return "You must specify a password.";
			} else {
				return "";
			}
		}
	};

	/* Rename Dialog */

	this.maindiv.append('<div id="rename-dialog" title="Rename"><form><p><span class="field-name">Username: </span>' +
		'<input type="text" name="user" id="rename-dialog-user" value="" class="login-text-field"></p>' +
		'</form><p><span class="dialog-error-msg" id="rename-dialog-error-msg"></span></p></div>');
	this.renamedialog = $("#rename-dialog").dialog({
		autoOpen: false,
		resizable: false,
		height: "auto",
		width: 400,
		modal: false,
		buttons: {
			"Rename": {
				text: "Rename",
				id: "rename-dialog-button",
				click: function () {
					var name = $("#rename-dialog-user").prop("value") || "";
					if (name.length === 0 || name.length > 25 || (/[\|,]+/g).test(name)) {
						$("#rename-dialog-error-msg").html("Invalid nickname.");
					} else if (Tools.toId(name) !== Tools.toId(this.currUser.name)) {
						$("#rename-dialog-error-msg").html("Use the login option in order to login into another account.");
					} else {
						this.renamedialog.dialog("close");
						this.home_room.send("/rename " + name);
					}
				}.bind(this)
			}
		}
	});

	/* Register Dialog */

	this.maindiv.append('<div id="register-dialog" title="Register Account"><form><p><span class="field-name">Username: </span>' +
		'<input type="text" name="user" id="register-dialog-user" value="" class="login-text-field"></p>' +
		'<p><span class="field-name">Password: </span><input type="password" name="pass" id="register-dialog-pass" value="" class="pass-text-field">' +
		'</p><p><span class="field-name">Password (again): </span><input type="password" name="pass" id="register-dialog-pass2" value="" class="pass-text-field">' +
		'</p></form><p><span class="dialog-error-msg" id="register-dialog-error-msg"></span></p></div>');
	this.registerdialog = $("#register-dialog").dialog({
		autoOpen: false,
		resizable: false,
		height: "auto",
		width: 400,
		modal: false,
		buttons: {
			"Register": {
				text: "Register",
				id: "register-dialog-button",
				click: function () {
					var res = this.registerdialog.checkRegisterFunc();
					if (res) {
						$("#register-dialog-error-msg").html(res);
					} else {
						this.registerdialog.dialog("close");
						this.home_room.send("/register " + $("#register-dialog-user").prop("value") + "," + $("#register-dialog-pass").prop("value"));
						$("#register-dialog-pass").prop("value", "");
						$("#register-dialog-pass2").prop("value", "");
					}
				}.bind(this)
			}
		}
	});
	this.registerdialog.checkRegisterFunc = function () {
		var txt = $("#register-dialog-user").prop("value") || "";
		if (txt.length === 0 || txt.length > 25 || Tools.toId(txt).length === 0 || Tools.toId(txt).length > 20 ||
																								(/[\|,]+/g).test(txt)) {
			return "Invalid nickname.";
		} else {
			txt = $("#register-dialog-pass").prop("value") || "";
			if (txt.length === 0) {
				return "You must specify a password.";
			} else if (txt !== $("#register-dialog-pass2").prop("value")) {
				return "The passwords do not match.";
			} else {
				return "";
			}
		}
	};

	/* Change Password Button */

	this.maindiv.append('<div id="cpassword-dialog" title="Change Password"><form><p><span class="field-name">Password: </span>' +
		'<input type="password" name="pass" id="cpassword-dialog-pass" value="" class="pass-text-field">' +
		'</p><p><span class="field-name">New Password: </span>' +
		'<input type="password" name="pass" id="cpassword-dialog-newpass" value="" class="pass-text-field">' +
		'</p><p><span class="field-name">New Password (again): </span>' +
		'<input type="password" name="pass" id="cpassword-dialog-newpass2" value="" class="pass-text-field">' +
		'</p></form><p><span class="dialog-error-msg" id="cpassword-dialog-error-msg"></span></p></div>');
	this.cpassworddialog = $("#cpassword-dialog").dialog({
		autoOpen: false,
		resizable: false,
		height: "auto",
		width: 450,
		modal: false,
		buttons: {
			"ChangePassword": {
				text: "Change Password",
				id: "cpassword-dialog-button",
				click: function () {
					var res = this.cpassworddialog.checkPasswordFunc();
					if (res) {
						$("#cpassword-dialog-error-msg").html(res);
					} else {
						this.cpassworddialog.dialog("close");
						var data = {
							pass: $("#cpassword-dialog-pass").prop("value"),
							newpass: $("#cpassword-dialog-newpass").prop("value")
						};
						this.home_room.send("/changepassword " + JSON.stringify(data));
						$("#cpassword-dialog-pass").prop("value", "");
						$("#cpassword-dialog-newpass").prop("value", "");
						$("#cpassword-dialog-newpass2").prop("value", "");
					}
				}.bind(this)
			}
		}
	});
	this.cpassworddialog.checkPasswordFunc = function () {
		var pass = $("#cpassword-dialog-pass").prop("value") || "";
		var npass = $("#cpassword-dialog-newpass").prop("value") || "";
		var npass2 = $("#cpassword-dialog-newpass2").prop("value") || "";
		if (pass.length === 0 || npass.length === 0) {
			return "You must specify both passwords.";
		} else if (npass !== npass2) {
			return "The passwords do not match.";
		} else {
			return "";
		}
	};

	/* Room dialog */

	this.dialogType = null;
	this.dialogSelectedRoom = "";
	this.activeDialog = false;
	this.dialogCallback = null;

	this.maindiv.append('<div id="dyn-room-dialog" title="Players Auction"><div id="dyn-room-dialog-content"></div></div>');
	this.dynamicDialog = $("#dyn-room-dialog").dialog({
		autoOpen: false,
		resizable: false,
		height: "auto",
		width: "auto",
		modal: true,
		buttons: {
			"Apply": {
				text: "Apply",
				id: "apply-room-dialog-button",
				click: function () {
					if (typeof this.dialogCallback === "function") {
						if (this.dialogCallback(this.dialogSelectedRoom)) {
							this.dynamicDialog.dialog("close");
						}
					} else {
						this.dynamicDialog.dialog("close");
					}
				}.bind(this)
			},
			"Cancel": {
				text: "Cancel",
				id: "cancel-room-dialog-button",
				click: function () {
					this.dynamicDialog.dialog("close");
				}.bind(this)
			}
		}
	});

	/* Buttons */

	$("#register-button").prop("disabled", true);
	$("#rename-button").prop("disabled", true);
	$("#login-button").prop("disabled", true);
	$("#cpassword-button").prop("disabled", true);

	this.rooms = {};
	this.home_room = new ClientMainRoom(this);
	this.maintabs.tabs("option", "active", 0);
	this.menuDisplayed = false;

	$(document).on('click', 'button', function (event) {
		var aux;
		switch (event.target.name) {
		case "reconnect":
			document.location.reload();
			break;
		case "joinroom":
			if (!this.rooms[$(event.target).prop("value")]) {
				this.home_room.send("/join " + $(event.target).prop("value"));
			} else {
				this.maintabs.tabs("option", "active", $('#tabs a[href="#' + $(event.target).prop("value") + '"]').parent().index());
			}
			break;
		case "login":
			this.logindialog.dialog("open");
			$("#login-dialog-error-msg").html("");
			break;
		case "rename":
			this.renamedialog.dialog("open");
			$("#rename-dialog-error-msg").html("");
			$("#rename-dialog-user").prop("value", this.currUser.name);
			break;
		case "register":
			this.registerdialog.dialog("open");
			$("#register-dialog-error-msg").html("");
			break;
		case "cpassword":
			this.cpassworddialog.dialog("open");
			$("#cpassword-dialog-error-msg").html("");
			break;
		case "menu":
			if (this.menuDisplayed) {
				$("#options-menu").css({"display": "none"});
				this.menuDisplayed = false;
			} else {
				$("#options-menu").css({"display": "inherit"});
				this.menuDisplayed = true;
			}
			break;
		case "changeconfig":
			aux = $(event.target).prop("value");
			this.showRoomDialog(aux, "Configuration - " + Tools.escapeHTML(this.rooms[aux] ? this.rooms[aux].name : aux), this.getDialog(aux, "CONFIG"), function (room) {
				return this.applyDialog(room, "CONFIG");
			}.bind(this));
			break;
		case "addteam":
			aux = $(event.target).prop("value");
			this.showRoomDialog(aux, "Add new team - " + Tools.escapeHTML(this.rooms[aux] ? this.rooms[aux].name : aux), this.getDialog(aux, "NEW-TEAM"), function (room) {
				return this.applyDialog(room, "NEW-TEAM");
			}.bind(this));
			break;
		case "deleteteam":
			aux = $(event.target).prop("value").split("|");
			this.showRoomDialog(aux[0], "Delete Team \"" + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].teamName(aux[1]) : aux[1]) +
					"\"? - " + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].name : aux[0]),
					this.getDialog(aux[0], "DELETE-TEAM"), function (room) {
						return this.applyDialog(room, "DELETE-TEAM", {team: aux[1]});
					}.bind(this));
			break;
		case "addplayers":
			aux = $(event.target).prop("value");
			this.showRoomDialog(aux, "Add Players - " + Tools.escapeHTML(this.rooms[aux] ? this.rooms[aux].name : aux), this.getDialog(aux, "ADD-PLAYERS"), function (room) {
				return this.applyDialog(room, "ADD-PLAYERS");
			}.bind(this));
			break;
		case "rmplayers":
			aux = $(event.target).prop("value");
			if (this.rooms[aux] && this.rooms[aux].getSelectedPlayers().length === 0) break;
			this.showRoomDialog(aux, "Delete Players - " + Tools.escapeHTML(this.rooms[aux] ? this.rooms[aux].name : aux), this.getDialog(aux, "DELETE-PLAYERS"), function (room) {
				return this.applyDialog(room, "DELETE-PLAYERS");
			}.bind(this));
			break;
		case "setturn":
			aux = $(event.target).prop("value").split("|");
			if (this.rooms[aux[0]]) {
				this.rooms[aux[0]].send("/turn " + aux[1]);
			}
			break;
		case "assignplayer":
			aux = $(event.target).prop("value").split("|");
			this.showRoomDialog(aux[0], "Assign player to team \"" + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].teamName(aux[1]) : aux[1]) +
					"\" - " + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].name : aux[0]),
					this.getDialog(aux[0], "ASSIGN-PLAYER", {team: aux[1]}), function (room) {
						return this.applyDialog(room, "ASSIGN-PLAYER", {team: aux[1]});
					}.bind(this));
			break;
		case "setfreeplayer":
			aux = $(event.target).prop("value").split("|");
			this.showRoomDialog(aux[0], "Release player of team \"" + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].teamName(aux[1]) : aux[1]) +
					"\" - " + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].name : aux[0]),
					this.getDialog(aux[0], "FREE-PLAYER", {team: aux[1]}), function (room) {
						return this.applyDialog(room, "FREE-PLAYER", {team: aux[1]});
					}.bind(this));
			break;
		case "setcaptain":
			aux = $(event.target).prop("value").split("|");
			this.showRoomDialog(aux[0], "Add captain for team \"" + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].teamName(aux[1]) : aux[1]) +
					"\" - " + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].name : aux[0]),
					this.getDialog(aux[0], "ADD-CAPTAIN", {team: aux[1]}), function (room) {
						return this.applyDialog(room, "ADD-CAPTAIN", {team: aux[1]});
					}.bind(this));
			break;
		case "rmcaptain":
			aux = $(event.target).prop("value").split("|");
			this.showRoomDialog(aux[0], "Delete captain of team \"" + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].teamName(aux[1]) : aux[1]) +
					"\" - " + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].name : aux[0]),
					this.getDialog(aux[0], "DELETE-CAPTAIN", {team: aux[1]}), function (room) {
						return this.applyDialog(room, "DELETE-CAPTAIN", {team: aux[1]});
					}.bind(this));
			break;
		case "setmoney":
			aux = $(event.target).prop("value").split("|");
			this.showRoomDialog(aux[0], "Set money of team \"" + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].teamName(aux[1]) : aux[1]) +
					"\" - " + Tools.escapeHTML(this.rooms[aux[0]] ? this.rooms[aux[0]].name : aux[0]),
					this.getDialog(aux[0], "SET-MONEY", {team: aux[1]}), function (room) {
						return this.applyDialog(room, "SET-MONEY", {team: aux[1]});
					}.bind(this));
			break;
		case "nominate":
			aux = $(event.target).prop("value");
			this.showRoomDialog(aux, "Nominate - " + Tools.escapeHTML(this.rooms[aux] ? this.rooms[aux].name : aux), this.getDialog(aux, "NOMINATE"), function (room) {
				return this.applyDialog(room, "NOMINATE");
			}.bind(this));
			break;
		case "bid":
			aux = $(event.target).prop("value");
			if (this.rooms[aux]) {
				this.rooms[aux].send("/bid " + (this.rooms[aux].nominatedCost + 0.5));
			}
			break;
		case "pass":
			aux = $(event.target).prop("value");
			if (this.rooms[aux]) {
				this.rooms[aux].send("/pass");
			}
			break;
		}
		event.preventDefault();
	}.bind(this));

	$(document).on('click', function (event) {
		if (event.target.name !== "menu") {
			$("#options-menu").css({"display": "none"});
			this.menuDisplayed = false;
		}
	}.bind(this));

	$(document).on('click', 'input', function (event) {
		if (event.target.name === "select-player-checkbox") {
			var data = $(event.target).prop("value").split("|");
			if (this.rooms[data[0]]) {
				this.rooms[data[0]].selectedPlayers[data[1]] = true;
				this.rooms[data[0]].checkSelectedPlayers();
			}
		}
	}.bind(this));
}

Client.prototype.connect = function () {
	if (document.location.protocol === "file:") {
		this.socket = new SockJS('http://localhost:8080/auction');
	} else {
		console.log("DEBUG: Protocol = " + document.location.protocol);
		this.socket = new SockJS('/auction');
	}
	this.socket.onclose = function () {
		console.log("Connection closed!");
		this.connected = false;
		this.onClose();
	}.bind(this);
	this.socket.onopen = function () {
		console.log("Connected to the server!");
		this.connected = true;
		$("#connect-msg-txt").html("Connected to the server, waiting for syn message...");
	}.bind(this);
	this.socket.onmessage = function (e) {
		if (typeof e.data === 'string') {
			console.log('<<< ' + e.data);
			this.parseMessage(e.data);
		} else {
			console.log("Message dropped: " + JSON.stringify(e.data));
		}
	}.bind(this);
};

Client.prototype.send = function (data) {
	if (this.connected) {
		this.socket.send(data);
	} else {
		console.log("Could not send: " + data);
	}
};

Client.prototype.showAlert = function (title, html) {
	$("#alert-msg-txt").html(html);
	this.alertsdialog.dialog('option', 'title', title);
	this.alertsdialog.dialog("open");
};

Client.prototype.onOpen = function () {
	$("#login-status").html("Connected");
	$("#login-status").css({color: "green"});
	$("#register-button").prop("disabled", false);
	$("#rename-button").prop("disabled", false);
	$("#login-button").prop("disabled", false);
};

Client.prototype.onClose = function () {
	$("#login-status").html("Not-Connected");
	$("#login-status").css({color: "red"});
	$("#register-button").prop("disabled", true);
	$("#rename-button").prop("disabled", true);
	$("#login-button").prop("disabled", true);
	$("#cpassword-button").prop("disabled", true);
	this.home_room.setNotConnected();
	for (var id in this.rooms) {
		this.rooms[id].setNotConnected();
	}
};

Client.prototype.parseMessage = function (msg) {
	var lines = msg.split("\n");
	var room;
	if (lines[0].charAt(0) === ":") {
		var serverTime = parseInt(lines[0].substr(1)) * 1000;
		this.timeoffset = Date.now() - serverTime;
		this.onOpen();
	} else if (lines[0].charAt(0) === "!") {
		this.showAlert('Warning', '<span>The server rejected the connection. It is possible your public IP address was banned.</span>');
	} else if (lines[0] === "@") {
		room = this.home_room;
	} else {
		room = this.rooms[Tools.toRoomId(lines[0])];
		if (!room) {
			room = new AuctionRoom(this, Tools.toRoomId(lines[0]));
			room.setLoginStatus(this.currUser.name);
			this.rooms[Tools.toRoomId(lines[0])] = room;
		}
	}
	var context = {client: this};
	for (var i = 1; i < lines.length; i++) {
		this.parseCommand(room, lines[i], context);
	}
};

Client.prototype.parseCommand = function (room, line, context) {
	line = line.split("|");
	var cmd = line[0];
	if (ServerCommandsHandlers[cmd]) {
		ServerCommandsHandlers[cmd](room, cmd, line, context);
	} else {
		room.addLine(Tools.escapeHTML(line.join("|")));
	}
};

Client.prototype.changeLogin = function (name, guest, group) {
	if (name !== undefined) {
		var token = Tools.getCookie("token");
		if (token && !this.currUser.id) {
			this.home_room.send("/token " + token);
		}
		this.currUser.name = name;
		this.currUser.id = Tools.toId(name);
	}
	if (guest !== undefined) this.currUser.guest = guest;
	if (group !== undefined) this.currUser.group = group;
	$("#login-status").html(Tools.escapeHTML(name));
	$("#login-status").css({color: "white"});
	if (guest) {
		$("#cpassword-button").prop("disabled", true);
	} else {
		$("#cpassword-button").prop("disabled", false);
	}
	this.home_room.setLoginStatus(name, group);
	for (var id in this.rooms) {
		this.rooms[id].setLoginStatus(name);
	}
};

Client.prototype.addTab = function (id, title, html) {
	var closebtn = (id !== "_home") ? "<span id='room-close-button-" + id + "' class='ui-icon ui-icon-close' role='presentation'>Close Room</span>" : "";
	var tabTemplate = "<li id='tab-" + id + "'><a href='#{href}'>#{label}</a> " + closebtn + "</li>";
	var li = $(tabTemplate.replace(/#\{href\}/g, "#" + id).replace(/#\{label\}/g, title));
	//this.maintabs.find( ".ui-tabs-nav" ).append( li );
	$("#main-tabs-ul").append(li);
	this.maintabs.append("<div class='room-div' id='" + id + "'><p>" + html + "</p></div>");
	this.maintabs.tabs("refresh");
};

Client.prototype.changeTabTitle = function (id, title) {
	$("#tab-" + id).find(".ui-tabs-anchor").html(Tools.escapeHTML(title));
	this.maintabs.tabs("refresh");
};

Client.prototype.changeTabTitleHTML = function (id, title) {
	$("#tab-" + id).find(".ui-tabs-anchor").html(title);
	this.maintabs.tabs("refresh");
};

Client.prototype.removeTab = function (id) {
	$("#tab-" + id).remove();
	$("#" + id).remove();
	this.maintabs.tabs("refresh");
};

Client.prototype.showRoomDialog = function (room, title, html, callback) {
	this.dialogType = title;
	this.dialogSelectedRoom = room;
	this.dialogCallback = callback;

	$("#dyn-room-dialog-content").html(html);

	this.activeDialog = true;
	this.dynamicDialog.dialog("option", "title", this.dialogType);
	this.dynamicDialog.dialog("open");
};

Client.prototype.getDialog = function (room, type, etc) {
	var html = '', players;
	room = this.rooms[room];
	if (!room) return;
	switch (type) {
	case "CONFIG":
		html += '<form>';
		html += '<p><span class="field-name">Bid Duration (seconds): </span>' +
				'<input type="text" id="dyn-dialog-timer" value="' + room.auction.config.timer + '" class="text-field"></p>';
		html += '<p><span class="field-name">Min players for completing teams: </span>' +
				'<input type="text" id="dyn-dialog-minplayers" value="' + room.auction.config.minplayers + '" class="text-field"></p>';
		html += '<p><span class="field-name">Nomination Cost (K): </span>' +
				'<input type="text" id="dyn-dialog-mincost" value="' + room.auction.config.mincost + '" class="text-field"></p>';
		html += '<p><span class="dialog-error-msg" id="dyn-dialog-error-msg"></span></p>';
		html += '</form>';
		break;
	case "NEW-TEAM":
		html += '<form>';
		html += '<p><span class="field-name">Team Name: </span>' +
				'<input type="text" id="dyn-dialog-name" value="" class="text-field"></p>';
		html += '<p><span class="field-name">Money (K): </span>' +
				'<input type="text" id="dyn-dialog-money" value="100" class="text-field"></p>';
		html += '<p><span class="dialog-error-msg" id="dyn-dialog-error-msg"></span></p>';
		html += '</form>';
		break;
	case "DELETE-TEAM":
		html += '<p><span class="dialog-danger-msg">Warning: This action is not reversible.</span></p>';
		break;
	case "ASSIGN-PLAYER":
		html += '<form>';
		html += '<p><span class="field-name">Player: </span><select class="config-select" id="dyn-dialog-player">';
		players = room.getFreePlayers();
		for (var p = 1; p < players.length; p++) {
			html += '<option value="' + Tools.toPlayerId(players[p]) + '">' + Tools.escapeHTML(players[p]) + '</option>';
		}
		html += '</select></p>';
		html += '<p><span class="field-name">Money (K): </span>' +
				'<input type="text" id="dyn-dialog-money" value="3" class="text-field"></p>';
		html += '<p><span class="dialog-error-msg" id="dyn-dialog-error-msg"></span></p>';
		html += '</form>';
		break;
	case "FREE-PLAYER":
		html += '<form>';
		html += '<p><span class="field-name">Player: </span><select class="config-select" id="dyn-dialog-player">';
		players = room.getPlayersByTeam(etc.team);
		for (var p = 1; p < players.length; p++) {
			html += '<option value="' + Tools.toPlayerId(players[p]) + '">' + Tools.escapeHTML(players[p]) + '</option>';
		}
		html += '</select></p>';
		html += '</form>';
		break;
	case "ADD-CAPTAIN":
		html += '<form>';
		html += '<p><span class="field-name">Captain Name: </span>' +
				'<input type="text" id="dyn-dialog-captain" value="" class="text-field"></p>';
		html += '</form>';
		break;
	case "DELETE-CAPTAIN":
		html += '<form>';
		html += '<p><span class="field-name">Captain: </span><select class="config-select" id="dyn-dialog-captain">';
		etc.captains = room.getCaptainsByTeam(etc.team);
		for (var c = 0; c < etc.captains.length; c++) {
			html += '<option value="' + Tools.toId(etc.captains[c]) + '">' + Tools.escapeHTML(etc.captains[c]) + '</option>';
		}
		html += '</select></p>';
		html += '</form>';
		break;
	case "SET-MONEY":
		html += '<form>';
		if (room.auction.teams[etc.team]) {
			etc.money = room.auction.teams[etc.team].money;
		} else {
			etc.money = 0;
		}
		html += '<p><span class="field-name">Money (K): </span>' +
				'<input type="text" id="dyn-dialog-money" value="' + etc.money + '" class="text-field"></p>';
		html += '<p><span class="dialog-error-msg" id="dyn-dialog-error-msg"></span></p>';
		html += '</form>';
		break;
	case "ADD-PLAYERS":
		html += '<form>';
		html += '<p><textarea class="config-textarea" id="dyn-dialog-players" placeholder="Player1, Player2, Player3, ..."></textarea></p>';
		html += '</form>';
		break;
	case "DELETE-PLAYERS":
		html += '<p><span class="dialog-danger-msg">Warning: This action is not reversible.</span></p>';
		html += '<p>Selected Players: ' + Tools.escapeHTML(room.getSelectedPlayers().join(', ')) + '</p>';
		break;
	case "NOMINATE":
		html += '<form>';
		html += '<p><span class="field-name">Player: </span><select class="config-select" id="dyn-dialog-player">';
		players = room.getFreePlayers();
		for (var p = 1; p < players.length; p++) {
			html += '<option value="' + Tools.toPlayerId(players[p]) + '">' + Tools.escapeHTML(players[p]) + '</option>';
		}
		html += '</select></p>';
		html += '</form>';
		break;
	}
	return html;
};

Client.prototype.applyDialog = function (room, type, etc) {
	room = this.rooms[room];
	if (!room) return;
	var params = {};
	switch (type) {
	case "CONFIG":
		params.timer = parseInt($("#dyn-dialog-timer").prop("value"));
		params.minplayers = parseInt($("#dyn-dialog-minplayers").prop("value"));
		params.mincost = parseFloat($("#dyn-dialog-mincost").prop("value"));
		if (isNaN(params.timer) || isNaN(params.mincost) || isNaN(params.minplayers)) {
			$("#dyn-dialog-error-msg").html("Invalid configuration. Make sure you type numbers.");
			return false;
		}
		if (params.timer < 5) {
			$("#dyn-dialog-error-msg").html("The bid time cannot be lesser than 5 seconds.");
			return false;
		}
		if (params.minplayers < 0) {
			$("#dyn-dialog-error-msg").html("A players number cannot be lesser than 0.");
			return false;
		}
		if (params.mincost <= 0) {
			$("#dyn-dialog-error-msg").html("Nominations cost must be higher than 0.");
			return false;
		}
		if ((params.mincost * 10) % 5 !== 0) {
			$("#dyn-dialog-error-msg").html("Invalid nomination cost. Use multiples of 0.5K.");
			return false;
		}
		room.send('/config ' + params.timer + ',' + params.mincost + ',' + params.minplayers);
		return true;
		break;
	case "NEW-TEAM":
		params.name = $("#dyn-dialog-name").prop("value").trim();
		params.id = Tools.toTeamId(params.name);
		params.money = parseFloat($("#dyn-dialog-money").prop("value"));
		if (!params.id || !params.name) {
			$("#dyn-dialog-error-msg").html("Invalid team name.");
			return false;
		}
		if (params.name.length > 50) {
			$("#dyn-dialog-error-msg").html("Team name is too long.");
			return false;
		}
		if ((/[,]+/g).test(params.name)) {
			$("#dyn-dialog-error-msg").html("Team name cannot contain commas.");
			return false;
		}
		if (room.auction.teams[params.id]) {
			$("#dyn-dialog-error-msg").html("The team name is already registered.");
			return false;
		}
		if (isNaN(params.money) || params.money < 0) {
			$("#dyn-dialog-error-msg").html("Money must be a positive number.");
			return false;
		}
		if ((params.money * 10) % 5 !== 0) {
			$("#dyn-dialog-error-msg").html("Invalid nomination cost. Use multiples of 0.5K.");
			return false;
		}
		room.send('/addteam ' + params.name + ',' + params.money);
		return true;
		break;
	case "DELETE-TEAM":
		room.send('/rmteam ' + etc.team);
		return true;
		break;
	case "ASSIGN-PLAYER":
		params.player = $("#dyn-dialog-player").prop("value");
		params.team = etc.team;
		params.money = parseFloat($("#dyn-dialog-money").prop("value"));
		if (isNaN(params.money) || params.money < 0) {
			$("#dyn-dialog-error-msg").html("Money must be a positive number.");
			return false;
		}
		if ((params.money * 10) % 5 !== 0) {
			$("#dyn-dialog-error-msg").html("Invalid nomination cost. Use multiples of 0.5K.");
			return false;
		}
		params.err = room.canPaid(params.team, params.money);
		if (params.err) {
			$("#dyn-dialog-error-msg").html(params.err);
			return false;
		}
		room.send('/assign ' + params.team + ',' + params.player + ',' + params.money);
		return true;
		break;
	case "FREE-PLAYER":
		room.send('/free ' + $("#dyn-dialog-player").prop("value"));
		return true;
		break;
	case "ADD-CAPTAIN":
		params.captain = Tools.toId($("#dyn-dialog-captain").prop("value"));
		params.team = etc.team;
		room.send('/setcaptain ' + params.team + ',' + params.captain);
		return true;
		break;
	case "DELETE-CAPTAIN":
		params.captain = Tools.toId($("#dyn-dialog-captain").prop("value"));
		room.send('/unsetcaptain ' + params.captain);
		return true;
		break;
	case "SET-MONEY":
		params.team = etc.team;
		params.money = parseFloat($("#dyn-dialog-money").prop("value"));
		if (isNaN(params.money) || params.money < 0) {
			$("#dyn-dialog-error-msg").html("Money must be a positive number.");
			return false;
		}
		if ((params.money * 10) % 5 !== 0) {
			$("#dyn-dialog-error-msg").html("Invalid nomination cost. Use multiples of 0.5K.");
			return false;
		}
		room.send('/setmoney ' + params.team + ',' + params.money);
		return true;
		break;
	case "ADD-PLAYERS":
		params.players = $("#dyn-dialog-players").prop("value");
		if (params.players) {
			room.send('/addplayers ' + params.players);
			return true;
		}
		break;
	case "DELETE-PLAYERS":
		params.players = room.getSelectedPlayers().join(', ');
		if (params.players) {
			room.send('/rmplayers ' + params.players);
		}
		return true;
		break;
	case "NOMINATE":
		room.send('/nominate ' + $("#dyn-dialog-player").prop("value"));
		return true;
		break;
	}
	return false;
};

Client.prototype.completeLine = function (line, room) {
	var users = room.users;
	if (!users) {
		users = {};
		users[this.currUser.id] = this.currUser;
	}
	if (!line) return line;
	var commandUsed = "";
	if (line.charAt(0) === "/") {
		var i = line.indexOf(" ");
		if (i) {
			commandUsed = line.substr(1, i - 1);
		} else {
			commandUsed = line.substr(1);
		}
		console.log("DEBUG: Command used - " + commandUsed);
	}
	if (line.indexOf(" ") === -1 && line.charAt(0) === "/") {
		/* Command */
		var cmds = [];
		var subCmd = line.substr(1);
		for (var c in CommandsUsageData) {
			if (c.substr(0, subCmd.length) === subCmd) {
				cmds.push(c);
			}
		}
		if (cmds.length === 0) {
			return line;
		} else if (cmds.length === 1) {
			return ("/" + cmds[0]);
		} else {
			room.addLine(Tools.escapeHTML(cmds.join(", ")));
			return line;
		}
	} else if (commandUsed && line.indexOf(" ") !== -1 && CommandsUsageData[commandUsed] === "<room>") {
		if (!this.home_room || !this.home_room.room_list) return line;
		var rooms = [];
		var index = line.lastIndexOf(" ");
		var subRoom = Tools.toRoomId(line.substr(index));
		for (var r in this.home_room.room_list) {
			if (r.substr(0, subRoom.length) === subRoom) {
				rooms.push(r);
			}
		}
		if (rooms.length === 0) {
			return line;
		} else if (rooms.length === 1) {
			return (line.substr(0, index + 1) + rooms[0]);
		} else {
			room.addLine(Tools.escapeHTML(rooms.join(", ")));
			return line;
		}
	} else if (commandUsed && line.indexOf(" ") !== -1 && CommandsUsageData[commandUsed] === "<player>") {
		if (!room.auction || !room.auction.players) return line;
		var freePlayers = room.getFreePlayers();
		var players = [];
		var index = line.lastIndexOf(" ");
		var subPlayer = Tools.toPlayerId(line.substr(index));
		var playerId;
		for (var p = 0; p < freePlayers.length; p++) {
			playerId = Tools.toPlayerId(freePlayers[p]);
			if (playerId.substr(0, subPlayer.length) === subPlayer) {
				players.push(freePlayers[p]);
			}
		}
		if (players.length === 0) {
			return line;
		} else if (players.length === 1) {
			return (line.substr(0, index + 1) + players[0]);
		} else {
			room.addLine(Tools.escapeHTML(players.join(", ")));
			return line;
		}
	} else if (line.indexOf(" ") !== -1) {
		var usrs = [];
		var index = line.lastIndexOf(" ");
		var subUser = Tools.toId(line.substr(index));
		if (subUser === "") return line;
		for (var u in users) {
			if (u.substr(0, subUser.length) === subUser) {
				usrs.push(users[u].name);
			}
		}
		if (usrs.length === 0) {
			return line;
		} else if (usrs.length === 1) {
			return (line.substr(0, index + 1) + usrs[0]);
		} else {
			room.addLine(Tools.escapeHTML(usrs.join(", ")));
			return line;
		}
	} else {
		return line;
	}
};

$(document).ready(function () {
	window.App = new Client($("#page-content"));
	App.connect();
});
