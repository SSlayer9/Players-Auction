/**
 * Groups Manager
 */

'use strict';

class Group {
	constructor(symbol, auth) {
		this.symbol = symbol || "+";
		this.auth = auth || 0;
	}

	getSymbol() {
		return this.symbol;
	}

	isExcepted() {
		return (this.auth >= 4);
	}

	isInvited() {
		return (this.auth >= 1);
	}

	isModerator() {
		return (this.auth >= 2);
	}

	canManageAuction() {
		return (this.auth >= 3);
	}

	canManageRoom() {
		return (this.auth >= 3);
	}

	canManageRoomAuth() {
		return (this.auth >= 3);
	}
}

const RegularGroup = new Group("+", 0);
const ParticipantGroup = new Group("%", 1);
const ModeratorGroup = new Group("@", 2);
const ManagerGroup = new Group("#", 3);
const AdminGroup = new Group("~", 4);

exports.getRegularGroup = function () {
	return RegularGroup;
};

exports.getParticipantGroup = function () {
	return ParticipantGroup;
};

exports.getModeratorGroup = function () {
	return ModeratorGroup;
};

exports.getManagerGroup = function () {
	return ManagerGroup;
};

exports.getAdminGroup = function () {
	return AdminGroup;
};

exports.getGroup = function (symbol) {
	switch (symbol) {
	case "~":
		return AdminGroup;
	case "#":
		return ManagerGroup;
	case "@":
		return ModeratorGroup;
	case "%":
		return ParticipantGroup;
	default:
		return RegularGroup;
	}
};
