/* Auction room specific methods */

AuctionRoom.prototype.teamName = function (team) {
	team = Tools.toTeamId(team);
	if (this.auction.teams[team]) {
		return this.auction.teams[team].name;
	} else {
		return team;
	}
};

AuctionRoom.prototype.playerName = function (player) {
	player = Tools.toPlayerId(player);
	if (this.auction.players[player]) {
		return this.auction.players[player].name;
	} else {
		return player;
	}
};

AuctionRoom.prototype.addPlayer = function (name) {
	this.auction.players[Tools.toPlayerId(name)] = {
		id: Tools.toPlayerId(name),
		name: name,
		team: null,
		cost: 0,
	};
};

AuctionRoom.prototype.removePlayer = function (name) {
	delete this.auction.players[Tools.toPlayerId(name)];
};

AuctionRoom.prototype.addTeam = function (name, money) {
	this.auction.teams[Tools.toTeamId(name)] = {
		id: Tools.toTeamId(name),
		name: name,
		money: money || 0,
		captains: {},
	};
};

AuctionRoom.prototype.deleteTeam = function (name) {
	var team = Tools.toTeamId(name);
	delete this.auction.teams[team];
	for (var id in this.auction.users) {
		if (this.auction.users[id].team === team) {
			this.auction.users[id].team = null;
			this.auction.users[id].cost = 0;
		}
	}
};

AuctionRoom.prototype.assignPlayer = function (player, team, money) {
	player = Tools.toPlayerId(player);
	team = Tools.toTeamId(team);
	this.auction.players[player].team = team;
	this.auction.players[player].cost = money;
	this.auction.teams[team].money -= money;
};

AuctionRoom.prototype.setFreePlayer = function (player) {
	player = Tools.toPlayerId(player);
	this.auction.teams[this.auction.players[player].team].money += this.auction.players[player].cost;
	this.auction.players[player].team = null;
	this.auction.players[player].cost = 0;
};

AuctionRoom.prototype.updateAuctionView = function () {
	if (!this.auction.teams || !this.auction.players) return;
	this.updateAuctionTab();
	this.updatePlayersTab();
	this.updateTeamsTab();
};

AuctionRoom.prototype.checkSelectedPlayers = function () {
	for (var player in this.selectedPlayers) {
		if (!this.auction.players[player]) {
			delete this.selectedPlayers[player];
		}
	}
};

AuctionRoom.prototype.getPlayersByTeam = function (team) {
	var players = [];
	for (var id in this.auction.players) {
		if (this.auction.players[id].team === team) {
			players.push(this.auction.players[id].name);
		}
	}
	return players.sort();
};

AuctionRoom.prototype.getPlayers = function () {
	var players = [];
	for (var id in this.auction.players) {
		players.push(this.auction.players[id].name);
	}
	return players.sort();
};

AuctionRoom.prototype.getFreePlayers = function () {
	var players = [];
	for (var id in this.auction.players) {
		if (this.auction.players[id].team) continue;
		players.push(this.auction.players[id].name);
	}
	return players.sort();
};

AuctionRoom.prototype.getSelectedPlayers = function () {
	var players = [];
	for (var id in this.auction.players) {
		if (!this.selectedPlayers[id]) continue;
		players.push(this.auction.players[id].name);
	}
	return players.sort();
};

AuctionRoom.prototype.getTeamByCaptain = function (captain) {
	for (var id in this.auction.teams) {
		if (this.auction.teams[id].captains[captain]) {
			return this.auction.teams[id];
		}
	}
	return null;
};

AuctionRoom.prototype.getCaptainsByTeam = function (team) {
	var captains = [];
	if (this.auction.teams[team]) {
		for (var c in this.auction.teams[team].captains) {
			captains.push(this.userName(c));
		}
	}
	return captains.sort();
};

AuctionRoom.prototype.canPaid = function (team, money) {
	team = this.auction.teams[team];
	if (!team) return "";
	if (!this.auction.config.minplayers) return "";
	if (team.money < money) {
		return "Team " + Tools.escapeHTML(team.name) + " has only " + team.money + "K.";
	}
	if (team.money - money <= ((this.auction.config.minplayers - this.getPlayersByTeam(team).length - 1) * this.auction.config.mincost)) {
		return "Team " + Tools.escapeHTML(team.name) + " canot paid " + money + "K. They need to complete their team.";
	} else {
		return "";
	}
};
