/**
 * Data Storage
 */

'use strict';

const Path = require('path');
const FileSystem = require('fs');

const DataBase = Tools('json-db');
const Checkdir = Tools('checkdir');

class JSONFilesStorage {
	constructor(path) {
		this.path = path;
		Checkdir(path);
		this.roomsPath = Path.resolve(this.path, "rooms/");
		Checkdir(this.roomsPath);

		this.usersDB = new DataBase(Path.resolve(this.path, "users.json"));
		this.rooms = {};
	}

	getUsersData() {
		return this.usersDB.get();
	}

	setUsersData(data) {
		this.usersDB.set(data);
		this.usersDB.write();
	}

	getRooms() {
		let files = FileSystem.readdirSync(this.roomsPath);
		let rooms = [];
		for (let file of files) {
			if ((/.+\.json$/i).test(file)) {
				rooms.push(file.substr(0, file.length - 5));
			}
		}
		return rooms;
	}

	getRoomDB(id) {
		if (!this.rooms[id]) {
			this.rooms[id] = new DataBase(Path.resolve(this.roomsPath, id + ".json"));
		}
		return this.rooms[id];
	}

	getRoomData(id) {
		return this.getRoomDB(id).get();
	}

	setRoomData(id, data) {
		let db = this.getRoomDB(id);
		db.set(data);
		db.write();
	}

	deleteRoom(id) {
		let db = this.getRoomDB(id);
		db.destroy();
	}
}

exports.JSONFilesStorage = JSONFilesStorage;
