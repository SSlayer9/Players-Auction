/**
 * Players Auction
 */

'use strict';

const AUCTION_STATUS_PAUSED = 0;
const AUCTION_STATUS_NOMINATED = 1;
const AUCTION_STATUS_TIMEOUT = 2;

const Text = Tools('text');
const Events = Tools('events');

class PlayersAuction {
	constructor() {
		this.players = {};
		this.teams = {};
		this.turn = "";
		this.config = {
			timer: 30,
			mincost: 3,
			minplayers: 0,
		};

		this.events = new Events();
		this.status = AUCTION_STATUS_PAUSED;
		this.timer = null;
		this.timedout = 0;
		this.nominated = null;
		this.nominatedTeam = null;
		this.nominatedCost = 0;
	}

	setConfig(timer, mincost, minplayers) {
		if (isNaN(timer) || isNaN(mincost) || isNaN(minplayers)) return false;
		if (timer < 5 || mincost <= 0 || minplayers < 0) return false;
		if ((mincost * 10) % 5 !== 0) return false;
		this.config = {
			timer: timer,
			mincost: mincost,
			minplayers: minplayers,
		};
		return true;
	}

	isPaused() {
		return (this.status === AUCTION_STATUS_PAUSED);
	}

	pause() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this.status = AUCTION_STATUS_PAUSED;
	}

	/* Teams and Players */

	getTeam(name) {
		let id = Text.toTeamId(name);
		return this.teams[id];
	}

	getTeamByCaptain(captain) {
		for (let team in this.teams) {
			if (this.teams[team].captains[captain]) {
				return this.teams[team];
			}
		}
		return null;
	}

	addTeam(name, money, captains) {
		let id = Text.toTeamId(name);
		if (!this.teams[id]) {
			this.teams[id] = {
				id: id,
				name: name,
				money: money || 0,
				captains: captains || {},
			};
			return true;
		} else {
			return false;
		}
	}

	removeTeam(id) {
		if (this.teams[id]) {
			for (let player in this.players) {
				if (this.players[player].team === id) {
					this.setFreePlayer(this.players[player]);
				}
			}
			if (this.turn === id) this.turn = "";
			delete this.teams[id];
			return true;
		} else {
			return false;
		}
	}

	addPlayer(name) {
		let id = Text.toPlayerId(name);
		if (id && !this.players[id]) {
			this.players[id] = {
				id: id,
				name: name,
				team: null,
				cost: 0,
			};
			return true;
		} else {
			return false;
		}
	}

	removePlayer(id) {
		if (this.players[id]) {
			delete this.players[id];
			return true;
		} else {
			return false;
		}
	}

	getPlayer(name) {
		let id = Text.toPlayerId(name);
		return this.players[id];
	}

	setPlayerToTeam(player, team, cost) {
		player.team = team.id;
		player.cost = cost;
	}

	setFreePlayer(player, retrive) {
		if (retrive && player.team) {
			let team = this.getTeam(player.team);
			if (team) team.money += player.cost;
		}
		player.team = null;
		player.cost = 0;
	}

	getPlayersByTeam(team) {
		let players = [];
		for (let player in this.players) {
			if (this.players[player].team === team.id) players.push(this.players[player]);
		}
		return players;
	}

	getFreePlayers() {
		let players = [];
		for (let player in this.players) {
			if (!this.players[player].team) players.push(this.players[player]);
		}
		return players;
	}

	/* Active */

	setTurn(team) {
		this.pause();
		this.turn = team.id;
	}

	setNextTurn() {
		let teams = Object.keys(this.teams);
		if (teams.length === 0) return;
		if (teams.length === 1) {
			this.setTurn(this.teams[teams[0]]);
		} else {
			let i = teams.indexOf(this.turn);
			if (i === -1) {
				this.setTurn(this.teams[teams[0]]);
			} else if (i >= (teams.length - 1)) {
				this.setTurn(this.teams[teams[0]]);
			} else {
				this.setTurn(this.teams[teams[i + 1]]);
			}
		}
	}

	isActiveBid() {
		return (this.status === AUCTION_STATUS_NOMINATED);
	}

	canNominate(team) {
		return (team.money >= this.config.mincost);
	}

	canPass(team) {
		let players = this.getPlayersByTeam(team);
		if (this.config.minplayers) {
			return (players.length >= this.config.minplayers);
		} else {
			return true;
		}
	}

	nominate(player, team) {
		if (!this.isPaused()) return;
		this.nominated = player;
		this.nominatedCost = this.config.mincost;
		this.nominatedTeam = team;
		this.status = AUCTION_STATUS_NOMINATED;
		this.timedout = Date.now() + (this.config.timer * 1000);
		this.timer = setTimeout(this.timeout.bind(this), this.config.timer * 1000);
	}

	canBid(team, cost) {
		if (this.nominatedTeam === team) return false;
		if (this.nominatedCost >= cost) return false;
		return true;
	}

	canPaid(team, money) {
		if (!this.config.minplayers) return true;
		if (team.money - money <= ((this.config.minplayers - this.getPlayersByTeam(team).length - 1) * this.config.mincost)) {
			return false;
		} else {
			return true;
		}
	}

	bid(team, cost) {
		if (!this.isActiveBid()) return false;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this.nominatedCost = cost;
		this.nominatedTeam = team;
		this.timedout = Date.now() + (this.config.timer * 1000);
		this.timer = setTimeout(this.timeout.bind(this), this.config.timer * 1000);
		return true;
	}

	timeout(forced) {
		if (!this.isActiveBid()) return false;
		this.status = AUCTION_STATUS_TIMEOUT;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		this.setPlayerToTeam(this.nominated, this.nominatedTeam, this.nominatedCost);
		this.nominatedTeam.money -= this.nominatedCost;

		this.events.emit('timeout', this.nominated, this.nominatedTeam, this.nominatedCost, forced);

		this.nominated = null;
		this.setNextTurn();
		this.status = AUCTION_STATUS_PAUSED;
		this.events.emit('newturn');
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

	load(data) {
		this.config = data.config;
		this.teams = data.teams;
		this.players = data.players;
		this.turn = data.turn;
	}

	exportData() {
		let data = {};
		data.config = this.config;
		data.teams = this.teams;
		data.players = this.players;
		data.turn = this.turn;
		return data;
	}
}

module.exports = PlayersAuction;
