/**
 * Message Parser
 */

'use strict';

const Path = require('path');
const Text = Tools('text');

const Commands = require(Path.resolve(__dirname, "commands.js"));

class Parser {
	constructor(app) {
		this.app = app;
	}

	parse(user, connection, message) {
		if (message.length > 1000) {
			user.sendMsg("ERR-LENGTH");
			return;
		}

		let lines = message.split("\n");
		if (lines.length < 2) return;

		let room = null;
		if (lines[0] !== "@") {
			room = this.app.rooms[Text.toRoomId(lines[0])];
			if (!room) {
				user.sendMsg("ERR-ROOM|" + Text.toRoomId(lines[0]));
				return;
			}
		}

		if (room && !room.users[user.id]) {
			user.sendMsg("ERR-ROOM|" + room.id);
			return;
		}

		if (lines.length > 4) {
			user.sendMsg("ERR-LINES");
			return;
		}

		for (let i = 1; i < lines.length; i++) {
			this.parseCommandLine(user, connection, room, lines[i]);
		}
	}

	parseCommandLine(user, connection, room, line) {
		if (line.length === 0) return;
		if (line.charAt(0) === "/" && (line.length < 2 || line.charAt(1) !== "/")) {
			// Command
			line = line.substr(1);
			let spaceIndex = line.indexOf(" ");

			let cmd, args;
			if (spaceIndex === -1) {
				cmd = Text.toCmdId(line);
				args = "";
			} else {
				cmd = Text.toCmdId(line.substr(0, spaceIndex));
				args = line.substr(spaceIndex);
			}

			if (typeof Commands[cmd] === "string") {
				cmd = Commands[cmd];
			}

			if (typeof Commands[cmd] === "function") {
				let context = new CommandContext(this, user, connection, room, cmd, args);
				try {
					Commands[cmd].call(context, args);
				} catch (err) {
					this.app.reportCrash(err);
					user.sendFrom(room, "CRASH-CMD|" + cmd + "|" + err.code + "|" + err.message);
				}
			} else {
				user.sendFrom(room, "ERR-CMD|" + cmd);
			}
		} else {
			// Chat
			if (line.length > 300 && !user.getGroup().isExcepted()) {
				user.sendFrom(room, "ERR-TOO-LONG");
				return;
			}
			if (!room) {
				user.sendMsg("CHAT|" + Math.floor(Date.now() / 1000) + "|" + user.getGroup().getSymbol() + "|" + user.name + "|" + line);
				return;
			}
			if (room.canChat(user)) {
				room.addChat(user, line);
			} else {
				user.sendFrom(room, "ERR-CANNOT-CHAT");
			}
		}
	}
}

class CommandContext {
	constructor(parser, user, connection, room, cmd, args) {
		this.parser = parser;
		this.app = this.parser.app;
		this.user = user;
		this.connection = connection;
		this.room = room;
		this.cmd = cmd;
		this.args = args;
	}

	reply() {
		let args = [];
		for (let i in arguments) {
			args.push(arguments[i]);
		}
		this.user.sendFrom(this.room, args.join("|"));
	}

	ok() {
		let args = ["OK", this.cmd];
		for (let i in arguments) {
			args.push(arguments[i]);
		}
		this.user.sendFrom(this.room, args.join("|"));
	}

	error() {
		let args = ["ERR", this.cmd];
		for (let i in arguments) {
			args.push(arguments[i]);
		}
		this.user.sendFrom(this.room, args.join("|"));
	}

	denied() {
		this.reply("ERR", "DENIED", this.cmd);
	}

	errUsage() {
		this.reply("ERR", "USAGE", this.cmd);
	}

	add() {
		let args = [];
		for (let i in arguments) {
			args.push(arguments[i]);
		}
		if (this.room) {
			this.room.add(args.join("|"));
		} else {
			this.user.sendFrom(this.room, args.join("|"));
		}
	}

	logAction(text) {
		this.app.log("[Command][By: " + this.user.id + " (" + this.app.getConnectionIP(this.connection) + ")][" + this.cmd + "] " + text);
	}
}

module.exports = Parser;
