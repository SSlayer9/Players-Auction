/**
 * Misc String utils
 */

'use strict';

/**
 * Transforms string to ID
 * @param {String} str
 * @returns {String} id
 */
exports.toId = function (str) {
	if (!str) return '';
	return ('' + str).toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Transforms string to Room ID
 * @param {String} str
 * @returns {String} room id
 */
exports.toRoomId = function (str) {
	if (!str) return '';
	return ('' + str).replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase();
};

/**
 * Transforms string to Player ID
 * @param {String} str
 * @returns {String} room id
 */
exports.toPlayerId = function (str) {
	if (!str) return '';
	return ('' + str).replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
};

/**
 * Transforms string to Team ID
 * @param {String} str
 * @returns {String} room id
 */
exports.toTeamId = function (str) {
	if (!str) return '';
	return ('' + str).replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
};

/**
 * Transforms string to Command ID
 * @param {String} str
 * @returns {String} command id
 */
exports.toCmdId = function (str) {
	if (!str) return '';
	return ('' + str).replace(/[^_a-zA-Z0-9-]+/g, '').toLowerCase();
};

/**
 * Removes lateral blank spaces
 * @param {String} str
 * @returns {String}
 */
exports.trim = function (str) {
	if (!str) return '';
	return ('' + str).trim();
};

/**
 * Escapes HTML code
 * @param {String} str
 * @returns {String}
 */
exports.escapeHTML = function (str) {
	if (!str) return '';
	return ('' + str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2f;');
};

/**
 * Gets a random ID
 * @param {Number} length
 * @returns {String} random ID
 */
exports.randomId = function (length) {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let str = '';
	for (let i = 0; i < length; i++) {
		str += chars.charAt(~~(Math.random() * chars.length));
	}
	return str;
};

/**
 * Gets a random token
 * @param {Number} length
 * @returns {String} random token
 */
exports.randomToken = function (length) {
	const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
	let str = '';
	for (let i = 0; i < length; i++) {
		str += chars.charAt(~~(Math.random() * chars.length));
	}
	return str;
};
