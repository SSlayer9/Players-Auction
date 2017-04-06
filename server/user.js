/**
 * User Representation
 */

'use strict';

const Path = require('path');
const Text = Tools('text');
const Events = Tools('events');

const Groups = require(Path.resolve(__dirname, "groups.js"));

class User {
	constructor(name, group, isGuest) {
		this.id = Text.toId(name);
		this.name = name;
		this.group = group;
		this.guest = isGuest || false;

		this.connections = [];
		this.ips = [];

		this.rooms = [];

		this.events = new Events();
	}

	send(text, conn) {
		if (conn) {
			conn.write(text);
		} else {
			for (let connection of this.connections) {
				connection.write(text);
			}
		}
	}

	sendFrom(room, text, conn) {
		if (room) {
			text = room.id + "\n" + text;
			this.send(text, conn);
		} else {
			this.sendMsg(text, conn);
		}
	}

	sendMsg(text, conn) {
		text = "@\n" + text;
		this.send(text, conn);
	}

	sendUserData() {
		this.sendMsg("USER|" + (this.guest ? "0" : "1") + "|" + this.getGroup().getSymbol() + "|" + this.name);
	}

	getGroup(room) {
		if (this.group.isExcepted()) return this.group;
		if (room) {
			if (room.auth[this.id]) {
				return Groups.getGroup(room.auth[this.id]);
			} else if (room.auction.getTeamByCaptain(this.id) !== null) {
				return Groups.getParticipantGroup();
			} else {
				return this.group;
			}
		} else {
			return this.group;
		}
	}

	addConnection(conn) {
		conn.userDataListener = function (message) {
			this.events.emit('message', this, conn, message);
		}.bind(this);
		conn.on('data', conn.userDataListener);
		conn.userCloseListener = function () {
			this.removeConnection(conn);
		}.bind(this);
		conn.on('close', conn.userCloseListener);
		this.connections.push(conn);
	}

	removeConnection(conn) {
		let index = this.connections.indexOf(conn);
		if (index >= 0) {
			conn.removeListener('data', conn.userDataListener);
			conn.removeListener('close', conn.userCloseListener);
			this.connections.splice(index, 1);
		}
		if (this.connections.length === 0) {
			this.events.emit('disconnect', this);
		}
	}

	merge(user) {
		user.events.removeAllListeners();
		let newRooms = [];
		if (this.token) user.sendMsg("TOKEN|" + this.token);
		user.sendMsg("USER|" + (this.guest ? "0" : "1") + "|" + this.getGroup().getSymbol() + "|" + this.name);
		for (let room of user.rooms) {
			if (this.rooms.indexOf(room) === -1) {
				room.sendInitialData(this);
				newRooms.push(room);
			}
			room.reportRename(user.id, this);
		}
		for (let room of this.rooms) {
			if (user.rooms.indexOf(room) === -1) {
				room.sendInitialData(user);
			}
		}
		for (let conn of user.connections) {
			conn.removeListener('data', conn.userDataListener);
			conn.removeListener('close', conn.userCloseListener);
			this.addConnection(conn);
		}
		for (let ip of user.ips) {
			if (user.ips.indexOf(ip) === -1) {
				user.ips.push(ip);
			}
		}
		for (let room of newRooms) {
			this.rooms.push(room);
		}
	}

	addRoom(room) {
		this.rooms.push(room);
	}

	removeRoom(room) {
		let index = this.rooms.indexOf(room);
		if (index >= 0) {
			this.rooms.splice(index, 1);
		}
	}

	/**
	 * @param {String} event
	 * @param {function} handler
	 */
	on(event, handler) {
		this.events.on(event, handler);
	}

	/**
	 * @param {String} event
	 * @param {function} handler
	 */
	removeListener(event, handler) {
		this.events.removeListener(event, handler);
	}

	removeAllListeners() {
		this.events.removeAllListeners();
	}

	disconnect() {
		for (let conn of this.connections) {
			try {
				conn.end();
			} catch (err) {}
		}
	}
}

module.exports = User;
