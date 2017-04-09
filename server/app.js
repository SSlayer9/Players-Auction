/**
 * Application Main
 */

'use strict';

const Path = require('path');
const Checkdir = Tools('checkdir');
const FileSystem = require('fs');
const Http = require('http');
const Https = require('https');
const SockJS = require('sockjs');
const Static = require('node-static');
const Crypto = require('crypto');
const Text = Tools('text');
const Logger = Tools('logs');

const User = require(Path.resolve(__dirname, "user.js"));
const Room = require(Path.resolve(__dirname, "room.js"));
const Groups = require(Path.resolve(__dirname, "groups.js"));
const Parser = require(Path.resolve(__dirname, "parser.js"));

const CYPTO_ALGORITHM = "aes-256-ctr";
const TOKEN_LENGTH = 40;
const MIN_REGISTER_WAIT = 12 * 60 * 60 * 1000; // 12 Hours
const TOKEN_EXPIRES = 24 * 60 * 60 * 1000;

/**
 * Encrypts a text
 * @param {String} text
 * @param {String} algorithm
 * @param {String} password
 * @returns {String} Encrypted text
 */
function encrypt(text, password) {
	let cipher = Crypto.createCipher(CYPTO_ALGORITHM, password);
	let crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

/**
 * Decrypts a text
 * @param {String} text - Encrypted text
 * @param {String} algorithm
 * @param {String} password
 * @returns {String} Decrypted text
 */
function decrypt(text, password) {
	let decipher = Crypto.createDecipher(CYPTO_ALGORITHM, password);
	let data = decipher.update(text, 'hex', 'utf8');
	data += decipher.final('utf8');
	return data;
}


class App {
	constructor(Config, storage, logsDir) {
		this.config = Config;
		this.storage = storage;
		this.usingProxy = this.config.proxy.using || false;

		this.nextUser = 0;
		this.users = {};
		this.tokens = {};
		this.userData = storage.getUsersData() || {};

		if (Object.keys(this.userData).length === 0) {
			this.registerUser(Config.auth.user, Config.auth.password);
		}

		this.rooms = {};

		this.logsDir = logsDir || Path.resolve(__dirname, "../logs/");
		Checkdir(this.logsDir);
		this.roomLogs = {};
		this.roomLogsDir = Path.resolve(this.logsDir, "rooms/");
		this.roomLogsOld = this.config.logs.maxOldRoom || 0;
		Checkdir(this.roomLogsDir);
		Checkdir(Path.resolve(this.logsDir, "app/"));
		this.appLog = new Logger(Path.resolve(this.logsDir, "app/"), "app", this.config.logs.maxOldApp || 0);

		let rooms = storage.getRooms();
		for (let roomid of rooms) {
			this.rooms[roomid] = new Room(this, roomid, storage);
			console.log("NEW ROOM: " + roomid);
		}

		this.bannedIps = {};
		this.registerCount = {};
		this.additionalUserData = {};

		this.parser = new Parser(this);

		this.server = SockJS.createServer({
			sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js",
			log: (severity, message) => {
				if (severity === 'error') console.log('ERROR: ' + message);
			},
			prefix: '/auction',
		});

		this.server.on('connection', this.connectionHandler.bind(this));

		if (this.config.http.enabled) {
			this.http_server = new Http.Server(this.requestHandler.bind(this));
			this.server.installHandlers(this.http_server);
		} else {
			this.http_server = null;
		}

		if (this.config.https.enabled) {
			const sslkey = Path.resolve(__dirname, "..", Config.https.key);
			const sslcert = Path.resolve(__dirname, "..", Config.https.cert);
			try {
				this.https_server = new Https.Server({key: FileSystem.readFileSync(sslkey),
					cert: FileSystem.readFileSync(sslcert)}, this.requestHandler.bind(this));
			} catch (err) {
				console.log('Could not create a ssl server. Missing key and certificate.');
			}
			if (this.https_server) {
				this.server.installHandlers(this.https_server);
			} else {
				this.https_server = null;
			}
		} else {
			this.https_server = null;
		}

		this.static_server = new Static.Server(Path.resolve(__dirname, "../client/"));
	}

	listen() {
		if (this.http_server) {
			this.http_server.listen(this.config.http.port, this.config.http.bindaddr, function (error) {
				if (error) {
					this.reportCrash(error);
				} else {
					console.log("Server lstening at http://" +
						(this.config.http.bindaddr ? this.config.http.bindaddr : "localhost") + ":" + this.config.http.port);
				}
			}.bind(this));
		}

		if (this.https_server) {
			this.https_server.listen(this.config.https.port, this.config.https.bindaddr, function (error) {
				if (error) {
					this.reportCrash(error);
				} else {
					console.log("Server lstening at https://" +
						(this.config.https.bindaddr ? this.config.https.bindaddr : "localhost") + ":" + this.config.https.port);
				}
			}.bind(this));
		}
	}

	requestHandler(request, response) {
		let static_server = this.static_server;
		request.addListener('end', function () {
			static_server.serve(request, response);
		}).resume();
	}

	getConnectionIP(connection) {
		let ip = connection.remoteAddress;
		if (this.usingProxy && connection.headers && connection.headers["x-forwarded-for"]) {
			ip = connection.headers["x-forwarded-for"];
		}
		return ip;
	}

	connectionHandler(connection) {
		if (!connection) return;
		if (!connection.remoteAddress) {
			try {
				connection.end();
			} catch (err) {}
		}

		let ip = this.getConnectionIP(connection);

		if (this.bannedIps[ip]) {
			connection.write("!");
			connection.end();
			return;
		}

		this.nextUser++;
		let newUser = new User("Guest " + this.nextUser, Groups.getRegularGroup(), true);

		this.users[newUser.id] = newUser;
		newUser.addConnection(connection);

		newUser.ips.push(ip);

		newUser.on("message", this.messageHandler.bind(this));
		newUser.on("disconnect", this.disconnectHandler.bind(this));

		this.sendInitialData(newUser, connection);
	}

	sendInitialData(user, connection) {
		user.send(":" + Math.floor(Date.now() / 1000), connection); // SYN

		let initInfo = [];

		initInfo.push("USER|" + (user.guest ? "0" : "1") + "|" + user.getGroup().getSymbol() + "|" + user.name);

		initInfo.push("ROOMS|" + JSON.stringify(this.getRoomsOverview()));

		user.sendMsg(initInfo.join('\n'), connection);
	}

	fullBroadcast(message) {
		for (let id in this.users) {
			this.users[id].sendMsg(message);
		}
	}

	getRoomsOverview() {
		let data = {};

		for (let id in this.rooms) {
			data[id] = {
				name: this.rooms[id].name,
			};
		}

		return data;
	}

	messageHandler(user, connection, message) {
		if (typeof message !== "string") return;
		if (message.length === 0) return;
		this.parser.parse(user, connection, message);
	}

	disconnectHandler(user) {
		let rooms = user.rooms.slice();
		let ids = [];
		for (let room of rooms) {
			room.removeUser(user);
			ids.push(room.id);
		}
		delete this.users[user.id];
		user.removeAllListeners();
		this.updateTokens(user.id, ids);
	}

	writeUserData() {
		this.storage.setUsersData(this.userData);
	}

	canRegister(user) {
		if (user.group.isExcepted()) return true;
		let now = Date.now();
		for (let ip in this.registerCount) {
			if (now - this.registerCount[ip] > MIN_REGISTER_WAIT) {
				delete this.registerCount[ip];
			}
		}
		for (let ip of user.ips) {
			if (this.registerCount[ip] !== undefined) {
				return false;
			}
		}
		for (let ip of user.ips) {
			this.registerCount[ip] = Date.now();
		}
		return true;
	}

	registerUser(id, password) {
		if (!this.userData[id]) {
			let token = Text.randomToken(TOKEN_LENGTH);
			let pass = encrypt(token, password);
			this.userData[id] = {
				token: token,
				pass: pass,
				auth: Groups.getRegularGroup().getSymbol(),
			};
			this.writeUserData();
		}
	}

	deleteUser(id) {
		if (this.userData[id]) {
			delete this.userData[id];
			this.writeUserData();
		}
		if (this.users[id]) {
			this.users[id].disconnect();
		}
	}

	checkPassword(id, password) {
		if (this.userData[id]) {
			let token = decrypt(this.userData[id].pass, password);
			return (this.userData[id].token === token);
		} else {
			return false;
		}
	}

	changePassword(id, newPassword) {
		if (this.userData[id]) {
			let token = Text.randomToken(TOKEN_LENGTH);
			let pass = encrypt(token, newPassword);
			this.userData[id].token = token;
			this.userData[id].pass = pass;
			this.writeUserData();
		}
	}

	checkTokens() {
		for (let token in this.tokens) {
			if (Date.now() - this.tokens[token].created > TOKEN_EXPIRES) {
				delete this.tokens[token];
			}
		}
	}

	makeToken(id) {
		this.checkTokens();
		let token;
		do {
			token = Text.randomToken(50);
		} while (this.tokens[token]);
		this.tokens[token] = {
			user: id,
			created: Date.now(),
			rooms: [],
		};
		return token;
	}

	updateTokens(id, rooms) {
		this.checkTokens();
		for (let token in this.tokens) {
			if (this.tokens[token].user === id) {
				this.tokens[token].rooms = rooms;
			}
		}
	}

	applyLogin(user, newName) {
		let newId = Text.toId(newName);
		if (!this.userData[newId]) return;
		let newUser = this.users[newId];
		if (!newUser) {
			newUser = new User(newName || newId, Groups.getGroup(this.userData[newId].auth), false);
			newUser.token = this.makeToken(newId);
			this.users[newId] = newUser;
			newUser.on("message", this.messageHandler.bind(this));
			newUser.on("disconnect", this.disconnectHandler.bind(this));
		}
		delete this.users[user.id];
		if (!this.additionalUserData[newId]) {
			this.additionalUserData[newId] = {ips: {}};
		}
		for (let ip of user.ips) {
			this.additionalUserData[newId].ips[ip] = true;
		}
		if (this.userData[user.id]) {
			if (!this.additionalUserData[user.id]) {
				this.additionalUserData[user.id] = {ips: {}};
			}
			for (let ip of newUser.ips) {
				this.additionalUserData[user.id].ips[ip] = true;
			}
		}
		newUser.merge(user);
		return newUser;
	}

	createRoom(id, name) {
		if (!this.rooms[id]) {
			this.rooms[id] = new Room(this, id, this.storage);
			this.rooms[id].name = name;
			this.rooms[id].writeRoomData();
			this.fullBroadcast("ROOMS|" + JSON.stringify(this.getRoomsOverview()));
		}
	}

	deleteRoom(id) {
		if (this.rooms[id]) {
			let room = this.rooms[id];
			room.auction.pause();
			delete this.rooms[id];
			this.fullBroadcast("ROOMS|" + JSON.stringify(this.getRoomsOverview()));
			for (let user of room.users) {
				room.removeUser(user);
			}
			this.storage.deleteRoom(id);
		}
	}

	/**
	 * Adds a line to the logger
	 * @param {String} text
	 */
	log(text) {
		this.appLog.log(text);
	}

	/**
	 * Adds a line to the room logger
	 * @param {String} room - Room id
	 * @param {String} text
	 */
	logRoom(room, text) {
		if (!this.roomLogs[room]) {
			let dir = Path.resolve(this.roomLogsDir, room);
			Checkdir(dir);
			this.roomLogs[room] = new Logger(dir, room, this.roomLogsOld);
		}
		this.roomLogs[room].log(text);
	}

	/**
	 * Reports a crash to the logger
	 * @param {Error} err - Error that causes the crash
	 */
	reportCrash(err) {
		let text = "";
		text += "CRASH - ";
		text += err.message + "\n";
		text += err.stack;
		console.log(text);
		this.log(text);
	}

}

module.exports = App;
