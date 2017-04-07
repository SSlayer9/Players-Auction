/* Server Commands parsing */

window.ServerCommandsHandlers = {
	"USER": function (room, cmd, spl, context) {
		context.client.changeLogin(spl.slice(3).join("|"), spl[1] === "0", spl[2]);
	},
	"ROOMS": function (room, cmd, spl, context) {
		context.client.home_room.setRoomsList(JSON.parse(spl.slice(1)));
	},
	"CHAT": function (room, cmd, spl, context) {
		room.addChat(spl[3], spl[2], spl.slice(4), (parseInt(spl[1]) * 1000) + context.client.timeoffset);
	},
	"ERR-CANNOT-CHAT": function (room, cmd, spl, context) {
		room.addLine('<span class="error-msg">You cannot chat in this room right now.</span>');
	},
	"ERR-CMD": function (room, cmd, spl, context) {
		if (spl[1] === "help") {
			room.add('<div class="chat-msg"><div class="chat-msg-box">' + $("#data-div-help-command").html() + '</div></div>');
		} else if (spl[1] === "adminhelp") {
			room.add('<div class="chat-msg"><div class="chat-msg-box">' + $("#data-div-adminhelp-command").html() + '</div></div>');
		} else {
			room.addLine('<span class="error-msg">Command not found: ' + Tools.escapeHTML(spl[1]) + '</span>');
		}
	},
	"ERR": function (room, cmd, spl, context) {
		switch (Tools.toId(spl[1])) {
		case "token":
			if (Tools.getCookie("token") === spl[3]) {
				document.cookie = "";
			}
			break;
		case "denied":
			room.addLine(Tools.escapeHTML(spl[2]) + ": access denied.");
			break;
		case "usage":
			if (spl[2] === "login") {
				context.client.logindialog.dialog("open");
				$("#login-dialog-error-msg").html("");
			} else if (spl[2] === "register") {
				context.client.registerdialog.dialog("open");
				$("#register-dialog-error-msg").html("");
			} else if (spl[2] === "changepassword") {
				context.client.cpassworddialog.dialog("open");
				$("#cpassword-dialog-error-msg").html("");
			} else if (CommandsUsageData[spl[2]]) {
				room.addLine("Usage: /" + Tools.escapeHTML(spl[2]) + " " + Tools.escapeHTML(CommandsUsageData[spl[2]]));
			} else {
				room.addLine("Invalid syntax for command /" + Tools.escapeHTML(spl[2]));
			}
			break;
		case "login":
			context.client.logindialog.dialog("open");
			switch (spl[2]) {
			case "INVALID-NAME":
				$("#login-dialog-error-msg").html("Ivalid username.");
				break;
			case "INVALID-LOGIN":
				$("#login-dialog-error-msg").html("Invalid password.");
				break;
			case "NOT-REGISTERED":
				$("#login-dialog-error-msg").html("The userame you chose is not registered.");
				break;
			}
			break;
		case "rename":
			context.client.renamedialog.dialog("open");
			switch (spl[2]) {
			case "INVALID-NAME":
				$("#rename-dialog-error-msg").html("Invalid username.");
				break;
			}
			break;
		case "register":
			context.client.registerdialog.dialog("open");
			switch (spl[2]) {
			case "GUEST":
				$("#register-dialog-error-msg").html("You cannot register a guest account.");
				break;
			case "INVALID-ID":
				$("#register-dialog-error-msg").html("Invalid user ID.");
				break;
			case "ALREADY-REGISTERED":
				$("#register-dialog-error-msg").html("The account is already registered");
				break;
			case "CANNOT-REGISTER":
				$("#register-dialog-error-msg").html("You are not allowed to register more than one account every 12 hours.");
				break;
			}
			break;
		case "deregister":
			switch (spl[2]) {
			case "IS-AUTH":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot deregister an account with authority. " + (spl[3] ? ("(room auth in " + Tools.escapeHTML(spl[3])) : ""));
				break;
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			}
			break;
		case "changepassword":
			context.client.cpassworddialog.dialog("open");
			switch (spl[2]) {
			case "NOT-REGISTERED":
				$("#cpassword-dialog-error-msg").html("You are not registered.");
				break;
			case "INVALID-PASSWORD":
				$("#cpassword-dialog-error-msg").html("Wrong password.");
				break;
			}
			break;
		case "join":
			switch (spl[2]) {
			case "NOT-FOUND":
				context.client.showAlert("Join Failure", "Room <b>" + Tools.escapeHTML(spl[3]) + "</b> not found.");
				break;
			case "DENIED":
				context.client.showAlert("Join Failure", "You are not allowed to join the room <b>" + Tools.escapeHTML(spl[3]) + "</b>");
				break;
			}
			break;
		case "admin":
			switch (spl[2]) {
			case "ALREADY-ADMIN":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is already administrator.");
				break;
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			}
			break;
		case "deadmin":
			switch (spl[2]) {
			case "NOT-ADMIN":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not an administrator.");
				break;
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			}
			break;
		case "manager":
			switch (spl[2]) {
			case "ALREADY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is already room manager.");
				break;
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			}
			break;
		case "moderator":
			switch (spl[2]) {
			case "ALREADY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is already moderator.");
				break;
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			}
			break;
		case "deauth":
			switch (spl[2]) {
			case "ALREADY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not room auth.");
				break;
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			}
			break;
		case "makeroom":
			switch (spl[2]) {
			case "ID-TOO-LONG":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Room identifier is too long.");
				break;
			case "NAME-TOO-LONG":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Room name is too long.");
				break;
			case "ALREADY-EXISTS":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Room '" + Tools.escapeHTML(spl[3]) + "' already exists.");
				break;
			}
			break;
		case "deleteroom":
			switch (spl[2]) {
			case "NOT-EXISTS":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Room '" + Tools.escapeHTML(spl[3]) + "' does not exists.");
				break;
			}
			break;
		case "private":
			switch (spl[2]) {
			case "ALREADY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Room '" + Tools.escapeHTML(spl[3]) + "' is already private.");
				break;
			}
			break;
		case "public":
			switch (spl[2]) {
			case "ALREADY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Room '" + Tools.escapeHTML(spl[3]) + "' is already public.");
				break;
			}
			break;
		case "roomname":
			switch (spl[2]) {
			case "NAME-TOO-LONG":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Room name is too long.");
				break;
			}
			break;
		case "modchat":
			switch (spl[2]) {
			case "ALREADY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Modchat is currently set to level " + Tools.escapeHTML(spl[3]) + ".");
				break;
			}
			break;
		case "ban":
			switch (spl[2]) {
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			}
			break;
		case "unban":
			switch (spl[2]) {
			case "NOT-BANNED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not banned.");
				break;
			}
			break;
		case "config":
			switch (spl[2]) {
			case "BAD-CONFIG":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "The configuration you chose for this auction is not valid.");
				break;
			}
			break;
		case "turn":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "TEAM-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			}
			break;
		case "addplayers":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "NO-PLAYERS":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "No players where added.");
				break;
			}
			break;
		case "rmplayers":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "NO-PLAYERS":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "No players where removed.");
				break;
			}
			break;
		case "addteam":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "INVALID-MONEY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Invalid money. You just use multiples of 0.5K.");
				break;
			case "INVALID-NAME":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Invalid name.");
				break;
			case "EXISTS":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) + "' already exists");
				break;
			}
			break;
		case "rmteam":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "NOT-EXISTS":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			}
			break;
		case "setcaptain":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "TEAM-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			case "NOT-REGISTERED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not registered.");
				break;
			case "ALREADY-SET":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is already a captain.");
				break;
			}
			break;
		case "unsetcaptain":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "NOT-CAPTAIN":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "User '" + Tools.escapeHTML(spl[3]) + "' is not a captain.");
				break;
			}
			break;
		case "setmoney":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "INVALID-MONEY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Invalid money. You just use multiples of 0.5K.");
				break;
			case "TEAM-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			}
			break;
		case "teamname":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "INVALID-NAME":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Invalid name.");
				break;
			case "TEAM-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			}
			break;
		case "assign":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "INVALID-MONEY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Invalid money. You must use multiples of 0.5K.");
				break;
			case "TEAM-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			case "PLAYER-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Player '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			case "PLAYER-NOT-FREE":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Player '" + Tools.escapeHTML(spl[3]) + "' is already member of another team.");
				break;
			case "LACKS-MONEY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) +
								"' does not have enougth money to paid " + Tools.escapeHTML(spl[4]) + "K.");
				break;
			case "CANNOT-PAID":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Team '" + Tools.escapeHTML(spl[3]) +
								"' cannot paid " + Tools.escapeHTML(spl[4]) + "K. They need to complete their team.");
				break;
			}
			break;
		case "free":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "PLAYER-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Player '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			case "ALREADY-FREE":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Player '" + Tools.escapeHTML(spl[3]) + "' is not assigned to any team.");
				break;
			}
			break;
		case "finalizebid":
			switch (spl[2]) {
			case "NOT-ACTIVE-BID":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "There is not an active bid.");
				break;
			}
			break;
		case "nominate":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "NOT-YOUR-TURN":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "It is not your turn.");
				break;
			case "LACKS-MONEY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You have not enought money to nominate.");
				break;
			case "PLAYER-NOT-FOUND":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Player '" + Tools.escapeHTML(spl[3]) + "' was not found.");
				break;
			case "NOT-FREE":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Player '" + Tools.escapeHTML(spl[3]) + "' is already member of another team.");
				break;
			}
			break;
		case "pass":
			switch (spl[2]) {
			case "NOT-PAUSED":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot do this when there is an active bid.");
				break;
			case "NOT-YOUR-TURN":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "It is not your turn.");
				break;
			case "CANNOT-PASS":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You cannot pass the turn. You need to complete your team.");
				break;
			}
			break;
		case "bid":
			switch (spl[2]) {
			case "NOT-ACTIVE-BID":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "There is not an active bid.");
				break;
			case "NOT-CAPTAIN":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You are not a team captain.");
				break;
			case "NOMINATING":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You already have the higher bid.");
				break;
			case "INVALID-MONEY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Invalid money. You must use multiples of 0.5K.");
				break;
			case "LACKS-MONEY":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "You team does not have enougth money to paid " +
							Tools.escapeHTML(spl[3]) + "K.");
				break;
			case "CANNOT-PAID":
				room.addLine(Tools.escapeHTML(spl[1]) + ": " + "Your team cannot paid " +
							Tools.escapeHTML(spl[3]) + "K. You need to complete your team.");
				break;
			}
			break;
		}
	},
	"OK": function (room, cmd, spl, context) {
		switch (Tools.toId(spl[1])) {
		case "register":
			context.client.showAlert("Registered", "The account <b>" + Tools.escapeHTML(spl[2]) + "</b> was registered sucessfully.");
			break;
		case "deregister":
			room.addLine("Account deregistered: " + Tools.escapeHTML(spl[2]));
			break;
		case "changepassword":
			context.client.showAlert("Change Password", "You have changed your password sucessfully.");
			break;
		case "admin":
			room.addLine("User promoted to administrator: " + Tools.escapeHTML(spl[2]));
			break;
		case "deadmin":
			room.addLine("User demoted: " + Tools.escapeHTML(spl[2]));
			break;
		case "makeroom":
			room.addLine("Room created: " + Tools.escapeHTML(spl[2]));
			break;
		case "deleteroom":
			room.addLine("Room deleted: " + Tools.escapeHTML(spl[2]));
			break;
		}
	},
	"INIT": function (room, cmd, spl, context) {
		room.setRoomName(spl.slice(1));
		context.init = true;
		context.client.maintabs.tabs("option", "active", $('#tabs a[href="#' + room.id + '"]').parent().index());
	},
	"CLOSED": function (room, cmd, spl, context) {
		context.client.removeTab(room.id);
		delete context.client.rooms[room.id];
	},
	"USERS": function (room, cmd, spl, context) {
		var users = JSON.parse(spl.slice(1).join("|"));
		var user;
		room.users = {};
		for (var i = 0; i < users.length; i++) {
			user = users[i].split("|");
			console.log(user[1]);
			room.users[Tools.toId(user[1])] = {
				id: Tools.toId(user[1]),
				name: user[1],
				group: user[0]
			};
		}
		room.updateAuctionView();
		room.updateUsersTab();
	},
	"AUCTION": function (room, cmd, spl, context) {
		room.auction = JSON.parse(spl.slice(1).join("|"));
		room.updateAuctionView();
	},
	"STATUS": function (room, cmd, spl, context) {
		room.status = parseInt(spl[1]);
		room.updateAuctionView();
	},
	"BS": function (room, cmd, spl, context) {
		room.nominated = spl[1];
		room.timeout = parseInt(spl[2]);
		room.nominatedTeam = spl[3];
		room.nominatedCost = parseFloat(spl[4]);
		room.updateAuctionView();
	},
	"J": function (room, cmd, spl, context) {
		room.users[Tools.toId(spl[2])] = {
			id: Tools.toId(spl[2]),
			name: spl[2],
			group: spl[1]
		};
		if (spl[1] !== "+") {
			room.addLine(Tools.escapeHTML(spl[2]) + " joined the room.");
		}
		room.updateAuctionView();
		room.updateUsersTab();
	},
	"L": function (room, cmd, spl, context) {
		var id = Tools.toId(spl[1]);
		if (room.users[id] && room.users[id].group !== "+") {
			room.addLine(Tools.escapeHTML(room.users[id].name) + " left the room.");
		}
		delete room.users[id];
		room.updateAuctionView();
		room.updateUsersTab();
	},
	"RN": function (room, cmd, spl, context) {
		var id = Tools.toId(spl[1]);
		if (Tools.toId(spl[3]) === id) {
			room.users[id].name = spl[3];
			room.users[id].group = spl[2];
			room.updateAuctionView();
			room.updateUsersTab();
			return;
		}
		var txt = "";
		if (room.users[id] && room.users[id].group !== "+") {
			txt += Tools.escapeHTML(room.users[id].name) + " left the room.";
		}
		delete room.users[id];
		id = Tools.toId(spl[3]);
		if (!room.users[id] && spl[2] !== "+") {
			txt += Tools.escapeHTML(spl[3]) + " joined the room.";
		}
		room.users[id] = {
			id: id,
			name: spl[3],
			group: spl[2]
		};
		room.addLine(txt);
		room.updateAuctionView();
		room.updateUsersTab();
	},
	"PROMOTED-ADMIN-BY": function (room, cmd, spl, context) {
		context.client.showAlert("Promoted", "You were promoted to administrator by <i>" + Tools.escapeHTML(spl[1]) + "</i>.");
	},
	"DEMOTED-ADMIN-BY": function (room, cmd, spl, context) {
		context.client.showAlert("Demoted", "You were taken administrator permissions by <i>" + Tools.escapeHTML(spl[1]) + "</i>.");
	},
	"MC": function (room, cmd, spl, context) {
		var txt = "";
		room.modchat = parseInt(spl[1]);
		switch (room.modchat) {
		case 0:
			txt = "Any registered user can talk.";
			break;
		case 1:
			txt = "Only participants and above can talk.";
			break;
		case 2:
			txt = "Only room managers and above can talk.";
			break;
		}
		room.addLine('<div class="announcement">Modchat level ' + Tools.escapeHTML(spl[1]) + ': ' + txt + '</div>');
	},
	"PROMOTION": function (room, cmd, spl, context) {
		var names = {
			"~": "Administrator",
			"#": "Room Manager",
			"@": "Moderator"
		};
		room.addLine('<div class="ban-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' was promoted to ' + names[spl[1]] +
			' by ' + Tools.escapeHTML(room.userName(spl[3])) + '</div>');
	},
	"DEMOTE": function (room, cmd, spl, context) {
		room.addLine('<div class="ban-announcement">' + Tools.escapeHTML(room.userName(spl[1])) + ' was demoted by ' +
			Tools.escapeHTML(room.userName(spl[2])) + '</div>');
	},
	"BAN": function (room, cmd, spl, context) {
		room.addLine('<div class="ban-announcement">' + Tools.escapeHTML(room.userName(spl[1])) + ' was banned from this room by ' +
			Tools.escapeHTML(room.userName(spl[2])) + '</div>');
	},
	"UNBAN": function (room, cmd, spl, context) {
		room.addLine('<div class="ban-announcement">' + Tools.escapeHTML(room.userName(spl[1])) + ' was unbanned by ' +
			Tools.escapeHTML(room.userName(spl[2])) + '</div>');
	},
	"ROOM": function (room, cmd, spl, context) {
		switch (spl[1]) {
		case "PRIVATE":
			if (spl[2] === "TRUE") {
				room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[3])) + ' made this room private.</div>');
			} else {
				room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[3])) + ' made this room public.</div>');
			}
			break;
		}
	},
	"ROOM-NAME-INF": function (room, cmd, spl, context) {
		if (!context.init) room.setRoomName(spl[2]);
		room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[1])) + ' changed the name of this room to ' + Tools.escapeHTML(spl.slice(2)) + '.</div>');
	},
	"MC-INF": function (room, cmd, spl, context) {
		var info = "";
		if (!context.init) room.modchat = parseInt(spl[1]);
		switch (room.modchat) {
		case 0:
			info = "Any registered user can talk now.";
			break;
		case 1:
			info = "Only participants and above can talk now.";
			break;
		case 2:
			info = "Only room managers can talk now.";
			break;
		}
		room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' changed the modchat level. ' + info + '</div>');
	},
	"INF": function (room, cmd, spl, context) {
		var aux;
		switch (spl[1]) {
		case "SET-CONFIG":
			if (!context.init) {
				room.auction.config.timer = parseInt(spl[2]);
				room.auction.config.mincost = parseFloat(spl[3]);
				room.auction.config.minplayers = parseInt(spl[4]);
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[5])) + ' changed the auction configuration.</div>');
			break;
		case "SET-TURN":
			if (!context.init) {
				room.auction.turn = spl[2];
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[3])) + ' set the turn for ' +
					Tools.escapeHTML(room.teamName(spl[2])) + '</div>');
			break;
		case "ADD-PLAYERS":
			aux = JSON.parse(spl.slice(3).join("|"));
			if (!context.init) {
				for (var i = 0; i < aux.length; i++)
					room.addPlayer(aux[i]);
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' added players: ' +
					Tools.escapeHTML(aux.join(', ')) + '</div>');
			break;
		case "RM-PLAYERS":
			aux = JSON.parse(spl.slice(3).join("|"));
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' deleted players: ' +
					Tools.escapeHTML(aux.join(', ')) + '</div>');
			if (!context.init) {
				for (var i = 0; i < aux.length; i++)
					room.removePlayer(aux[i]);
			}
			break;
		case "NEW-TEAM":
			if (!context.init) {
				room.addTeam(spl[3], parseFloat(spl[4]));
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' registered team: ' +
					Tools.escapeHTML(room.teamName(spl[3])) + '</div>');
			break;
		case "DELETE-TEAM":
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' deleted team: ' +
					Tools.escapeHTML(room.teamName(spl[3])) + '</div>');
			if (!context.init) {
				room.deleteTeam(spl[3]);
			}
			break;
		case "SET-CAPTAIN":
			if (!context.init) {
				room.auction.teams[spl[3]].captains[spl[4]] = true;
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' add ' +
					Tools.escapeHTML(room.userName(spl[4])) + ' as a captain for team ' + Tools.escapeHTML(room.teamName(spl[3])) + '</div>');
			break;
		case "RM-CAPTAIN":
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' removed ' +
					Tools.escapeHTML(room.userName(spl[4])) + ' as a captain.</div>');
			if (!context.init) {
				delete room.auction.teams[spl[3]].captains[spl[4]];
			}
			break;
		case "SET-MONEY":
			if (!context.init) {
				room.auction.teams[spl[3]].money = parseFloat(spl[4]);
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' set money of team ' +
					Tools.escapeHTML(room.teamName(spl[3])) + ' at ' + Tools.escapeHTML(spl[4]) + 'K.</div>');
			break;
		case "SET-NAME":
			if (!context.init) {
				room.auction.teams[spl[3]].name = spl.slice(4);
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' updated team name: ' +
					Tools.escapeHTML(room.teamName(spl[3])) + '</div>');
			break;
		case "ASSIGN":
			if (!context.init) {
				room.assignPlayer(spl[4], spl[3], parseFloat(spl[5]));
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' assigned player ' +
					Tools.escapeHTML(room.playerName(spl[4])) + ' to team ' + Tools.escapeHTML(room.teamName(spl[3])) +
					' for ' + Tools.escapeHTML(spl[5]) + 'K.</div>');
			break;
		case "FREE":
			if (!context.init) {
				room.setFreePlayer(spl[3]);
			}
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' removed player ' +
					Tools.escapeHTML(room.playerName(spl[3])) + ' from team ' + Tools.escapeHTML(room.teamName(spl[4])) +
					'. ' + Tools.escapeHTML(spl[5]) + 'K were retrived.</div>');
			break;
		case "FINALIZE-BID":
			room.addLine('<div class="config-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ' forced the timeout.</div>');
			break;
		case "PASS":
			room.addLine('<div class="auction-announcement">' + Tools.escapeHTML(room.userName(spl[2])) + ', ' + Tools.escapeHTML(room.teamName(spl[3])) + ' passed the turn.</div>');
			break;
		}
		if (!context.init) {
			room.updateAuctionView();
		}
	},
	"TURN-INF": function (room, cmd, spl, context) {
		if (!context.init) {
			room.status = 0;
			room.auction.turn = spl[1];
			room.updateAuctionView();
		}
		room.addLine('<div class="auction-announcement">' + Tools.escapeHTML(room.teamName(spl[1])) + ' has the turn for nominating a player.</div>');
	},
	"NOMINATED": function (room, cmd, spl, context) {
		if (!context.init) {
			room.nominated = spl[3];
			room.nominatedCost = room.auction.config.mincost;
			room.nominatedTeam = spl[2];
			room.status = 1;
			room.timeout = parseInt(spl[4]);
			room.updateAuctionView();
		}
		room.addLine('<div class="auction-announcement">' + Tools.escapeHTML(room.userName(spl[1])) + ', ' +
			Tools.escapeHTML(room.teamName(spl[2])) + ' nominated player ' + Tools.escapeHTML(room.playerName(spl[3])) +
			' for ' + Tools.escapeHTML(room.auction.config.mincost) + 'K.</div>');
	},
	"BID": function (room, cmd, spl, context) {
		if (!context.init) {
			room.nominatedCost = parseFloat(spl[3]);
			room.nominatedTeam = spl[2];
			room.timeout = parseInt(spl[4]);
			room.updateAuctionView();
		}
		room.addLine('<div class="auction-announcement">' + Tools.escapeHTML(room.userName(spl[1])) + ', ' +
			Tools.escapeHTML(room.teamName(spl[2])) + ' offers ' + Tools.escapeHTML(spl[3]) + 'K.</div>');
	},
	"TO": function (room, cmd, spl, context) {
		console.log("TO: " + context.init);
		if (!context.init) {
			room.assignPlayer(spl[1], spl[2], parseFloat(spl[3]));
			room.nominated = null;
			room.nominatedCost = 0;
			room.nominatedTeam = null;
			room.status = 2;
			room.timeout = 0;
			room.updateAuctionView();
		}
		room.addLine('<div class="auction-announcement">Time is out! ' + Tools.escapeHTML(room.playerName(spl[1])) +
			' was assigned to ' + Tools.escapeHTML(room.teamName(spl[2])) + ' for ' + Tools.escapeHTML(spl[3]) + 'K.</div>');
	},
	"TOKEN": function (room, cmd, spl, context) {
		document.cookie = "token=" + spl[1] + "; path=/";
	},
	"ERR-ROOM": function () {
		return;
	},
};
