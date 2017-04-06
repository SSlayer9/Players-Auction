/**
 * Config Manager
 */

'use strict';

const FileSystem = require('fs');

class ConfigManager {
	/**
	 * @param {Path} file
	 */
	constructor(file) {
		this.data = {};
		this.file = file;
		this.text = FileSystem.readFileSync(this.file).toString();

		let lines = this.text.split("\n");

		let state = null;
		for (let line of lines) {
			line = line.trim();
			if (!line || line.charAt(0) === "#") continue;
			if (line.charAt(0) === "[") {
				let stateId = line.replace(/[^A-Za-z0-9-_]+/g, '');
				if (!this.data[stateId]) {
					this.data[stateId] = {};
				}
				state = this.data[stateId];
			} else if (state !== null) {
				let spl = line.split("=");
				let field = spl[0].replace(/[^A-Za-z0-9-_]+/g, '');
				let value = spl[1].trim();
				state[field] = value;
			}
		}
	}

	get(zone, field) {
		let zoneObj = this.data[zone];
		if (zoneObj) {
			return zoneObj[field];
		} else {
			return undefined;
		}
	}

	has(zone, field) {
		let zoneObj = this.data[zone];
		if (zoneObj) {
			if (zoneObj[field] !== undefined) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
}

module.exports = ConfigManager;
