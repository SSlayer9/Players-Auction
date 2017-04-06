/**
 * Tools manager
 *
 * Intended for making a global to provide
 * tools stored in a unique directory without
 * specifying the relative path
 */

'use strict';

const Path = require('path');

exports.path = '';

/**
 * Resolves a tool script file
 * @param {String} filename
 * @returns {Path}
 */
function resolveTool(filename) {
	if ((/.*\.js$/).test(filename)) {
		return Path.resolve(exports.path, filename);
	} else {
		return Path.resolve(exports.path, filename + '.js');
	}
}

/**
 * Requires a Tool script
 * @param {String} filename
 */
function requireTool(filename) {
	return require(resolveTool(filename));
}

/**
 * Sets the tools path
 * @param {Path} path
 */
exports.setPath = function (path) {
	exports.path = path;
	return module.exports;
};

/**
 * Creates the Tools global
 */
exports.makeGlobal = function () {
	global.Tools = requireTool;
	Tools.get = requireTool;
	Tools.resolve = resolveTool;
};
