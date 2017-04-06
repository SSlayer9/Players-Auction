/**
 * Room managment
 */

'use strict';

const MAX_LOG_LENGTH = 20;

const Path = require('path');

const Auction = require(Path.resolve(__dirname, "auction.js"));

class AuctionRoom {
	constructor(app, id, storage) {
		this.app = app;
		this.storage = storage;
		this.id = id;
		this.name = id;

		this.users = {};
		this.auth = {};
		this.bannedusers = {};
		this.bannedips = {};
		this.modchat = 0;
		this.private = false;

		this.auction = new Auction();

		if (storage) {
			let data = storage.getRoomData(id);
			if (data) {
				if (data.name) {
					this.name = data.name;
				}
				this.private = !!data.private;
				if (data.modchat) {
					this.modchat = data.modchat;
				}
				if (data.auth) {
					this.auth = data.auth;
				}
				if (data.auction) {
					this.auction.load(data.auction);
				}
			}
		}

		this.log = [];

		this.auction.on('newturn', function () {
			this.add("TURN-INF|" + this.auction.turn);
			this.writeRoomData();
		}.bind(this));

		this.auction.on('timeout', function (nominated, team, cost, forced) {
			this.add("TO|" + nominated.id + "|" + team.id + "|" + cost);
		}.bind(this));
	}

	broadcast(text) {
		for (let u in this.users) {
			this.users[u].sendFrom(this, text);
		}
	}

	add(text) {
		this.log.push(text);
		if (this.log.length > MAX_LOG_LENGTH) {
			this.log.shift();
		}
		this.app.logRoom(this.id, text);
		this.broadcast(text);
	}

	addChat(user, msg) {
		this.add("CHAT|" + Math.floor(Date.now() / 1000) + "|" + user.getGroup(this).getSymbol() + "|" + user.name + "|" + msg);
	}

	canChat(user) {
		if (user.guest) return false;
		switch (this.modchat) {
		case 1:
			return user.getGroup(this).isInvited();
		case 2:
			return user.getGroup(this).canManageAuction();
		default:
			return true;
		}
	}

	reportRename(userid, newUser) {
		if (this.users[userid]) {
			this.broadcast("RN|" + userid + "|" + newUser.getGroup(this).getSymbol() + "|" + newUser.name);
			if (userid !== newUser.id) {
				delete this.users[userid];
				this.users[newUser.id] = newUser;
			}
		}
	}

	addUser(user) {
		if (!this.users[user.id]) {
			user.addRoom(this);
			this.sendInitialData(user);
			this.users[user.id] = user;
			if (!user.guest) {
				this.broadcast("J|" + user.getGroup(this).getSymbol() + "|" + user.name);
			}
		}
	}

	userCanJoin(user) {
		if (user.getGroup(this).isExcepted()) {
			return true;
		}
		if (this.private && !user.getGroup(this).isInvited()) {
			return false;
		}
		if (this.bannedusers[user.id]) {
			return false;
		}
		for (let ip of user.ips) {
			if (this.bannedips[ip]) {
				return false;
			}
		}

		return true;
	}

	getUsersData() {
		let users = [];
		for (let id in this.users) {
			if (this.users[id].guest) continue;
			users.push(this.users[id].getGroup(this).getSymbol() + "|" + this.users[id].name);
		}
		return users;
	}

	sendInitialData(user, connection) {
		let messages = [];
		messages.push("INIT|" + this.name);

		messages.push("USERS|" + JSON.stringify(this.getUsersData()));

		messages.push("AUCTION|" + JSON.stringify(this.auction.exportData()));

		messages.push("STATUS|" + this.auction.status);

		if (this.auction.isActiveBid()) {
			messages.push("BS|" + this.auction.nominated.id + "|" + this.auction.timedout + "|" +
				this.auction.nominatedTeam.id + "|" + this.auction.nominatedCost);
		}

		for (let msg of this.log) {
			messages.push(msg);
		}

		messages.push("MC|" + this.modchat);

		user.sendFrom(this, messages.join("\n"), connection);
	}

	removeUser(user) {
		if (this.users[user.id]) {
			user.sendFrom(this, "CLOSED");
			user.removeRoom(this);
			delete this.users[user.id];
			if (!user.guest) {
				this.broadcast("L|" + user.id);
			}
		}
	}

	makePrivate() {
		this.private = true;
		for (let userid in this.users) {
			if (!this.userCanJoin(this.users[userid])) {
				this.removeUser(this.users[userid]);
			}
		}
		this.writeRoomData();
	}

	makePublic() {
		this.private = false;
		this.writeRoomData();
	}

	setModchat(level, by) {
		this.modchat = level;
		this.add("MC-INF|" + level + "|" + by);
		this.writeRoomData();
	}

	changeName(newName, by) {
		this.name = newName;
		this.add("ROOM-NAME-INF|" + by + "|" + newName);
		this.writeRoomData();
	}

	banUser(id, userInfo) {
		this.bannedusers[id] = true;
		if (userInfo) {
			for (let ip in userInfo.ips) {
				this.bannedips[ip] = true;
			}
		}
		for (let userid in this.users) {
			if (!this.userCanJoin(this.users[userid])) {
				this.removeUser(this.users[userid]);
			}
		}
	}

	unbanUser(id, userInfo) {
		delete this.bannedusers[id];
		if (userInfo) {
			for (let ip in userInfo.ips) {
				delete this.bannedips[ip];
			}
		}
	}

	writeRoomData() {
		if (!this.storage) return;
		let data = {
			name: this.name,
			auth: this.auth,
			private: this.private,
			modchat: this.modchat,
			auction: this.auction.exportData(),
		};
		this.storage.setRoomData(this.id, data);
	}
}

module.exports = AuctionRoom;
