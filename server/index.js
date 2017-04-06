/**
 * Startup File
 */

'use strict';

const Path = require('path');

require(Path.resolve(__dirname, "tools.js")).setPath(Path.resolve(__dirname, "tools/")).makeGlobal();

const Application = require(Path.resolve(__dirname, "app.js"));
const Storage = require(Path.resolve(__dirname, "data-storage.js"));

exports.start = function (Config, env) {
	let dataDir = Path.resolve(__dirname, "../data/");
	let logsDir = Path.resolve(__dirname, "../logs/");
	if (process.env['OPENSHIFT_DATA_DIR']) {
		/* Openshift Node catridge */
		logsDir = Path.resolve(process.env['OPENSHIFT_DATA_DIR'], 'logs/');
		dataDir = Path.resolve(process.env['OPENSHIFT_DATA_DIR'], 'data/');
		Config.proxy.using = true;
	}

	if (process.env['PORT']) {
		Config.http.port = process.env['PORT'];
	} else if (process.env['OPENSHIFT_NODEJS_PORT']) {
		Config.http.port = process.env['OPENSHIFT_NODEJS_PORT'];
	}

	if (process.env['BIND_IP']) {
		Config.http.bindaddress = process.env['BIND_IP'];
	} else if (process.env['OPENSHIFT_NODEJS_IP']) {
		Config.http.bindaddress = process.env['OPENSHIFT_NODEJS_IP'];
	}

	const CrashGuardTemplate = Tools('crashguard');

	const App = new Application(Config, new Storage.JSONFilesStorage(dataDir), logsDir);

	global.CrashGuard = new CrashGuardTemplate(err => {
		App.reportCrash(err);
	});

	App.listen();
};

