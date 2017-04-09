/**
 * User Commands
 */

'use strict';

const MAX_ROOM_ID = 40;
const MAX_ROOM_NAME = MAX_ROOM_ID + 10;
const MAX_USER_ID = 20;
const MAX_USER_NAME = MAX_USER_ID + 5;

const Path = require('path');

const Text = Tools('text');
const Groups = require(Path.resolve(__dirname, 'groups.js'));

const Commands = {
	/* Basic */
	login: function (args) {
		args = args.split(",");
		if (args.length < 2) {
			return this.errUsage();
		}
		let newname = Text.trim(args[0]).replace(/[\|,]+/g, '');
		let id = Text.toId(newname);
		let pass = Text.trim(args.slice(1));
		if (!id || !pass) {
			return this.errUsage();
		}
		if (id === this.user.id) {
			return;
		}
		if (newname.length > 25) {
			return this.error("INVALID-NAME", newname);
		}
		if (this.app.userData[id]) {
			if (this.app.checkPassword(id, pass)) {
				this.app.applyLogin(this.user, newname);
			} else {
				this.error("INVALID-LOGIN", newname);
			}
		} else {
			this.error("NOT-REGISTERED", newname);
		}
	},

	token: function (args) {
		let token = Text.trim(args);
		this.app.checkTokens();
		if (this.app.tokens[token]) {
			let user = this.app.tokens[token].user;
			if (this.user.id === user) return;
			if (this.app.userData[user]) {
				this.user = this.app.applyLogin(this.user, user);
				for (let roomid of this.app.tokens[token].rooms) {
					let room = this.app.rooms[roomid];
					if (room) {
						room.addUser(this.user);
					}
				}
			} else {
				delete this.app.tokens[token];
				this.error("INVALID-TOKEN", token);
			}
		} else {
			this.error("INVALID-TOKEN", token);
		}
	},

	rename: function (args) {
		let newname = Text.trim(args).replace(/[\|,]+/g, '');
		if (newname.length > 25 || Text.toId(newname) !== this.user.id) {
			return this.error("INVALID-NAME", newname);
		}
		this.user.name = newname;
		this.user.sendUserData();
		for (let room of this.user.rooms) {
			room.reportRename(this.user.id, this.user);
		}
	},

	register: function (args) {
		args = args.split(",");
		if (args.length < 2) {
			return this.errUsage();
		}
		let id = Text.toId(args[0]);
		let pass = Text.trim(args.slice(1));
		if (!id || !pass) {
			return this.errUsage();
		}
		if ((/^guest[0-9]+/i).test(id)) {
			return this.error("GUEST", id);
		}
		if (id.length > 20) {
			return this.error("INVALID-ID", id);
		}
		if (this.app.canRegister(this.user)) {
			if (!this.app.userData[id]) {
				this.app.registerUser(id, pass);
				this.ok(id);
				this.logAction("Registered user: " + id);
			} else {
				this.error("ALREADY-REGISTERED", id);
			}
		} else {
			this.error("CANNOT-REGISTER");
		}
	},

	deregister: function (args) {
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup().isExcepted()) {
			return this.denied();
		}
		if (this.app.userData[id]) {
			if (Groups.getGroup(this.app.userData[id].auth).isExcepted()) {
				return this.error("IS-AUTH", id, "_home");
			}
			for (let roomid in this.app.rooms) {
				if (this.app.rooms[roomid].auth[id]) {
					return this.error("IS-AUTH", id, roomid);
				}
			}
			this.app.deleteUser(id);
			this.ok(id);
			this.logAction("Removed user account: " + id);
		} else {
			this.error("NOT-REGISTERED", id);
		}
	},

	changepassword: function (args) {
		let data;
		try {
			data = JSON.parse(args);
		} catch (err) {
			return this.errUsage();
		}
		if (typeof data !== "object") {
			return this.errUsage();
		}
		let id = this.user.id;
		let pass1 = Text.trim(data.pass);
		let pass2 = Text.trim(data.newpass);
		if (!pass1 || !pass2) {
			return this.errUsage();
		}
		if (this.app.userData[id]) {
			if (this.app.checkPassword(id, pass1)) {
				this.app.changePassword(id, pass2);
				this.ok();
			} else {
				this.error("INVALID-PASSWORD");
			}
		} else {
			this.error("NOT-REGISTERED");
		}
	},

	join: function (args) {
		let roomid = Text.toRoomId(args);
		if (!roomid) return this.errUsage();
		let room = this.app.rooms[roomid];
		if (!room) {
			return this.error("NOT-FOUND", roomid);
		}
		if (room.users[this.user.id]) {
			return;
		}
		if (room.userCanJoin(this.user)) {
			room.addUser(this.user);
		} else {
			this.error("DENIED", roomid);
		}
	},

	leave: function (args) {
		let roomid = Text.toRoomId(args) || (this.room ? this.room.id : "");
		let room = this.app.rooms[roomid];
		if (!room) {
			return;
		}
		if (!room.users[this.user.id]) {
			return;
		}
		room.removeUser(this.user);
	},

	/* Groups and auth */
	admin: function (args) {
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup().isExcepted()) {
			return this.denied();
		}
		if (this.app.userData[id]) {
			if (this.app.userData[id].auth !== Groups.getAdminGroup().getSymbol()) {
				this.app.userData[id].auth = Groups.getAdminGroup().getSymbol();
				this.app.writeUserData();
				if (this.app.users[id]) {
					this.app.users[id].group = Groups.getGroup(this.app.userData[id].auth);
					this.app.users[id].sendUserData();
					for (let room of this.app.users[id].rooms) {
						room.reportRename(id, this.app.users[id]);
					}
					this.app.users[id].sendMsg("PROMOTED-ADMIN-BY", this.user.name);
				}
				this.ok(id);
				this.logAction("Promoted to administrator: " + id);
			} else {
				this.error("ALREADY-ADMIN", id);
			}
		} else {
			this.error("NOT-REGISTERED", id);
		}
	},

	deadmin: function (args) {
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup().isExcepted()) {
			return this.denied();
		}
		if (this.app.userData[id]) {
			if (this.app.userData[id].auth === Groups.getAdminGroup().getSymbol()) {
				this.app.userData[id].auth = Groups.getRegularGroup().getSymbol();
				this.app.writeUserData();
				if (this.app.users[id]) {
					this.app.users[id].group = Groups.getGroup(this.app.userData[id].auth);
					this.app.users[id].sendUserData();
					for (let room of this.app.users[id].rooms) {
						room.reportRename(id, this.app.users[id]);
					}
					this.app.users[id].sendMsg("DEMOTED-ADMIN-BY", this.user.name);
				}
				this.ok(id);
				this.logAction("Demoted from administrator: " + id);
			} else {
				this.error("NOT-ADMIN", id);
			}
		} else {
			this.error("NOT-REGISTERED", id);
		}
	},

	manager: function (args) {
		if (!this.room) return;
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup(this.room).canManageRoomAuth()) {
			return this.denied();
		}
		if (this.app.userData[id]) {
			if (this.room.auth[id] !== Groups.getManagerGroup().getSymbol()) {
				this.room.auth[id] = Groups.getManagerGroup().getSymbol();
				this.room.writeRoomData();
				if (this.room.users[id]) {
					this.room.reportRename(id, this.app.users[id]);
				}
				this.add("PROMOTION", Groups.getManagerGroup().getSymbol(), id, this.user.id);
			} else {
				this.error("ALREADY", id);
			}
		} else {
			this.error("NOT-REGISTERED", id);
		}
	},

	moderator: function (args) {
		if (!this.room) return;
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup(this.room).canManageRoomAuth()) {
			return this.denied();
		}
		if (this.app.userData[id]) {
			if (this.room.auth[id] !== Groups.getModeratorGroup().getSymbol()) {
				this.room.auth[id] = Groups.getModeratorGroup().getSymbol();
				this.room.writeRoomData();
				if (this.room.users[id]) {
					this.room.reportRename(id, this.app.users[id]);
				}
				this.add("PROMOTION", Groups.getModeratorGroup().getSymbol(), id, this.user.id);
			} else {
				this.error("ALREADY", id);
			}
		} else {
			this.error("NOT-REGISTERED", id);
		}
	},

	deauth: function (args) {
		if (!this.room) return;
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup(this.room).canManageRoomAuth()) {
			return this.denied();
		}
		if (this.app.userData[id]) {
			if (this.room.auth[id]) {
				delete this.room.auth[id];
				this.room.writeRoomData();
				if (this.room.users[id]) {
					this.room.reportRename(id, this.app.users[id]);
				}
				this.add("DEMOTE", id, this.user.id);
			} else {
				this.error("ALREADY", id);
			}
		} else {
			this.error("NOT-REGISTERED", id);
		}
	},

	/* Room managment */

	makeroom: function (args) {
		let name = Text.trim(args);
		let id = Text.toRoomId(name);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup().isExcepted()) {
			return this.denied();
		}
		if (id.length > 40) {
			return this.error("ID-TOO-LONG");
		}
		if (name.length > 50) {
			return this.error("NAME-TOO-LONG");
		}
		if (!this.app.rooms[id]) {
			this.app.createRoom(id, name);
			this.ok(id);
			this.logAction("Created room: " + id);
		} else {
			return this.error("ALREADY-EXISTS", id);
		}
	},

	deleteroom: function (args) {
		let id = Text.toRoomId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup().isExcepted()) {
			return this.denied();
		}
		if (this.app.rooms[id]) {
			this.app.deleteRoom(id);
			this.ok(id);
			this.logAction("Deleted room: " + id);
		} else {
			return this.error("NOT-EXISTS", id);
		}
	},

	private: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageRoom()) {
			return this.denied();
		}
		if (this.room.private) {
			return this.error("ALREADY");
		}
		this.room.makePrivate();
		this.add("ROOM", "PRIVATE", "TRUE", this.user.id);
	},

	public: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageRoom()) {
			return this.denied();
		}
		if (!this.room.private) {
			return this.error("ALREADY");
		}
		this.room.makePublic();
		this.add("ROOM", "PRIVATE", "FALSE", this.user.id);
	},

	roomname: function (args) {
		if (!this.room) return;
		let name = Text.trim(args);
		if (!name) {
			return this.errUsage();
		}
		if (!this.user.getGroup().isExcepted()) {
			return this.denied();
		}
		if (name.length > 50) {
			return this.error("NAME-TOO-LONG");
		}
		this.room.changeName(name, this.user.id);
		this.app.fullBroadcast("ROOMS|" + JSON.stringify(this.app.getRoomsOverview()));
		this.logAction("Changed room name: " + this.room.id + ", " + name);
	},

	modchat: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageRoom()) {
			return this.denied();
		}
		let level = parseInt(args);
		if (isNaN(level) || level < 0 || level > 2) {
			return this.errUsage();
		}
		if (this.room.modchat === level) {
			return this.error("ALREADY", level);
		}
		this.room.setModchat(level, this.user.id);
	},

	/* Punishments */
	ban: function (args) {
		if (!this.room) return;
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup(this.room).isModerator()) {
			return this.denied();
		}
		if (this.app.userData[id]) {
			if (this.user.getGroup(this.room).auth <= Groups.getGroup(this.app.userData[id].auth).auth && !this.user.getGroup().isExcepted()) {
				return this.denied();
			}
			this.room.banUser(id, this.app.additionalUserData[id]);
			this.add("BAN", id, this.user.id);
		} else {
			return this.error("NOT-REGISTERED", id);
		}
	},

	unban: function (args) {
		if (!this.room) return;
		let id = Text.toId(args);
		if (!id) {
			return this.errUsage();
		}
		if (!this.user.getGroup(this.room).isModerator()) {
			return this.denied();
		}
		if (this.app.userData[id] && this.room.bannedusers[id]) {
			if (this.user.getGroup(this.room).auth <= Groups.getGroup(this.app.userData[id].auth).auth && !this.user.getGroup().isExcepted()) {
				return this.denied();
			}
			this.room.unbanUser(id, this.app.additionalUserData[id]);
			this.add("UNBAN", id, this.user.id);
		} else {
			return this.error("NOT-BANNED", id);
		}
	},

	/* Auction - Admin */
	config: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		args = args.split(',');
		if (args.length < 3) {
			return this.errUsage();
		}
		let timer = parseInt(args[0]);
		let mincost = parseFloat(args[1]);
		let minplayers = parseInt(args[2]);
		if (this.room.auction.setConfig(timer, mincost, minplayers)) {
			this.add("INF", "SET-CONFIG", timer, mincost, minplayers, this.user.id);
			this.room.writeRoomData();
		} else {
			return this.error("BAD-CONFIG", timer, mincost, minplayers);
		}
	},

	turn: function (args) {
		if (!this.room) return;
		let team = Text.toTeamId(args);
		if (!team) {
			return this.errUsage();
		}
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		let teamObj = this.room.auction.getTeam(team);
		if (!teamObj) {
			return this.error("TEAM-NOT-FOUND", team);
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		this.room.auction.turn = teamObj.id;
		this.add("INF", "SET-TURN", teamObj.id, this.user.id);
		this.room.writeRoomData();
	},

	addplayers: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		args = args.split(',');
		let players = [];
		for (let arg of args) {
			let name = Text.trim(arg);
			if (name.length > MAX_USER_NAME) continue;
			if (this.room.auction.addPlayer(name)) {
				players.push(name);
			}
		}
		if (players.length > 0) {
			this.add("INF", "ADD-PLAYERS", this.user.id, JSON.stringify(players));
			this.room.writeRoomData();
		} else {
			return this.error("NO-PLAYERS");
		}
	},

	rmplayers: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		args = args.split(',');
		let players = [];
		for (let arg of args) {
			let id = Text.toPlayerId(arg);
			if (this.room.auction.removePlayer(id)) {
				players.push(id);
			}
		}
		if (players.length > 0) {
			this.add("INF", "RM-PLAYERS", this.user.id, JSON.stringify(players));
			this.room.writeRoomData();
		} else {
			return this.error("NO-PLAYERS");
		}
	},

	addteam: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		args = args.split(',');
		if (args.length !== 2) {
			return this.errUsage();
		}
		let name = Text.trim(args[0]);
		let id = Text.toTeamId(name);
		let money = parseFloat(args[1]);
		if (!id || isNaN(money) || money < 0) {
			return this.errUsage();
		}
		if ((money * 10) % 5 !== 0) {
			return this.error("INVALID-MONEY");
		}
		if (name.length > MAX_ROOM_NAME) {
			return this.error("INVALID-NAME", name);
		}
		if (this.room.auction.addTeam(name, money)) {
			this.add("INF", "NEW-TEAM", this.user.id, name, money);
			this.room.writeRoomData();
		} else {
			return this.error("EXISTS", id);
		}
	},

	rmteam: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		let id = Text.toTeamId(args);
		if (!id) {
			return this.errUsage();
		}
		if (this.room.auction.removeTeam(id)) {
			this.add("INF", "DELETE-TEAM", this.user.id, id);
			this.room.writeRoomData();
		} else {
			return this.error("NOT-EXISTS", id);
		}
	},

	setcaptain: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		args = args.split(',');
		if (args.length !== 2) {
			return this.errUsage();
		}
		let team = this.room.auction.getTeam(args[0]);
		if (!team) {
			return this.error("TEAM-NOT-FOUND", args[0]);
		}
		let captain = Text.toId(args[1]);
		if (!this.app.userData[captain]) {
			return this.error("NOT-REGISTERED", captain);
		}
		if (this.room.auction.getTeamByCaptain(captain) !== null) {
			return this.error("ALREADY-SET", captain);
		}
		team.captains[captain] = true;
		if (this.room.users[captain]) {
			this.room.reportRename(captain, this.app.users[captain]);
		}
		this.add("INF", "SET-CAPTAIN", this.user.id, team.id, captain);
		this.room.writeRoomData();
	},

	unsetcaptain: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		let captain = Text.toId(args);
		if (!captain) {
			return this.errUsage();
		}
		let team = this.room.auction.getTeamByCaptain(captain);
		if (!team) {
			return this.error("NOT-CAPTAIN", captain);
		}

		if (team.captains[captain]) {
			delete team.captains[captain];
			if (this.room.users[captain]) {
				this.room.reportRename(captain, this.app.users[captain]);
			}
			this.add("INF", "RM-CAPTAIN", this.user.id, team.id, captain);
			this.room.writeRoomData();
		} else {
			return this.error("NOT-CAPTAIN", captain);
		}
	},

	setmoney: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		args = args.split(',');
		if (args.length !== 2) {
			return this.errUsage();
		}
		let team = this.room.auction.getTeam(args[0]);
		if (!team) {
			return this.error("TEAM-NOT-FOUND", args[0]);
		}
		let money = parseFloat(args[1]);
		if (isNaN(money) || money < 0 || (money * 10) % 5 !== 0) {
			return this.error("INVALID-MONEY");
		}
		team.money = money;
		this.add("INF", "SET-MONEY", this.user.id, team.id, money);
		this.room.writeRoomData();
	},

	teamname: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		args = args.split(',');
		if (args.length !== 2) {
			return this.errUsage();
		}
		let name = Text.trim(args[0]);
		let team = this.room.auction.getTeam(name);
		if (!team) {
			return this.error("TEAM-NOT-FOUND", args[0]);
		}
		if (name.length > MAX_ROOM_NAME) {
			return this.error("INVALID-NAME", name);
		}
		team.name = name;
		this.add("INF", "SET-NAME", this.user.id, team.id, name);
		this.room.writeRoomData();
	},

	assign: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		args = args.split(',');
		if (args.length !== 3) {
			return this.errUsage();
		}
		let team = this.room.auction.getTeam(args[0]);
		if (!team) {
			return this.error("TEAM-NOT-FOUND", args[0]);
		}
		let player = this.room.auction.getPlayer(args[1]);
		if (!player) {
			return this.error("PLAYER-NOT-FOUND", args[1]);
		}
		if (player.team !== null) {
			return this.error("PLAYER-NOT-FREE", player.id);
		}
		let money = parseFloat(args[2]);
		if (isNaN(money) || money < 0 || (money * 10) % 5 !== 0) {
			return this.error("INVALID-MONEY");
		}
		if (money > team.money) {
			return this.error("LACKS-MONEY", team.id, money);
		}
		if (!this.room.auction.canPaid(team, money)) {
			return this.error("CANNOT-PAID", team.id, money);
		}
		this.room.auction.setPlayerToTeam(player, team, money);
		team.money -= money;
		this.add("INF", "ASSIGN", this.user.id, team.id, player.id, money);
		this.room.writeRoomData();
	},

	free: function (args) {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		let player = this.room.auction.getPlayer(args);
		if (!player) {
			return this.error("PLAYER-NOT-FOUND", args);
		}
		if (player.team === null) {
			return this.error("ALREADY-FREE", player.id);
		}
		let money = player.cost, team = player.team;
		this.room.auction.setFreePlayer(player, true);
		this.add("INF", "FREE", this.user.id, player.id, team, money);
		this.room.writeRoomData();
	},

	finalizebid: function () {
		if (!this.room) return;
		if (!this.user.getGroup(this.room).canManageAuction()) {
			return this.denied();
		}
		if (!this.room.auction.isActiveBid()) {
			return this.error("NOT-ACTIVE-BID");
		}
		this.room.auction.timeout(true);
		this.add("INF", "FINALIZE-BID", this.user.id);
	},

	/* Auction - Participate */

	nominate: function (args) {
		if (!this.room) return;
		if (!args) return this.errUsage();
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		let team = this.room.auction.getTeamByCaptain(this.user.id);
		if (!team || this.room.auction.turn !== team.id) {
			return this.error("NOT-YOUR-TURN");
		}
		if (!this.room.auction.canNominate(team)) {
			return this.error("LACKS-MONEY");
		}
		let player = this.room.auction.getPlayer(args);
		if (!player) {
			return this.error("PLAYER-NOT-FOUND", args);
		}
		if (player.team !== null) {
			return this.error("NOT-FREE", player.id);
		}
		this.room.auction.nominate(player, team);
		this.add("NOMINATED", this.user.id, team.id, player.id, this.room.auction.timedout);
	},

	pass: function () {
		if (!this.room) return;
		if (!this.room.auction.isPaused()) {
			return this.error("NOT-PAUSED");
		}
		let team = this.room.auction.getTeamByCaptain(this.user.id);
		if (!team || this.room.auction.turn !== team.id) {
			return this.error("NOT-YOUR-TURN");
		}
		if (!this.room.auction.canPass(team)) {
			return this.error("CANNOT-PASS");
		}
		this.room.auction.setNextTurn();
		this.add("INF", "PASS", this.user.id, team.id);
		this.room.auction.events.emit('newturn');
	},

	bid: function (args) {
		if (!this.room) return;
		if (!this.room.auction.isActiveBid()) {
			return this.error("NOT-ACTIVE-BID");
		}
		let team = this.room.auction.getTeamByCaptain(this.user.id);
		if (!team) {
			return this.error("NOT-CAPTAIN");
		}
		if (team === this.room.auction.nominatedTeam) {
			return this.error("NOMINATING");
		}
		let money = parseFloat(args || (this.room.auction.nominatedCost + 0.5));
		if (isNaN(money) || money < 0 || (money * 10) % 5 !== 0) {
			return this.error("INVALID-MONEY");
		}
		if (money <= this.room.auction.nominatedCost) {
			return this.error("INVALID-BID");
		}
		if (money > team.money) {
			return this.error("LACKS-MONEY", money);
		}
		if (!this.room.auction.canPaid(team, money)) {
			return this.error("CANNOT-PAID", money);
		}
		this.room.auction.bid(team, money);
		this.add("BID", this.user.id, team.id, money, this.room.auction.timedout);
	},
};

module.exports = Commands;
