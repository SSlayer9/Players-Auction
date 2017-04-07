/**
 * Players Auction Client Tools
 */

window.Tools = {};

Tools.toId = function (str) {
	if (!str) return '';
	return ('' + str).toLowerCase().replace(/[^a-z0-9]/g, '');
};

Tools.toRoomId = function (str) {
	if (!str) return '';
	return ('' + str).replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase();
};


Tools.toPlayerId = function (str) {
	if (!str) return '';
	return ('' + str).replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
};


Tools.toTeamId = function (str) {
	if (!str) return '';
	return ('' + str).replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
};

Tools.escapeHTML = function (html) {
	return ('' + html).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2f;');
};

Tools.fillWithLeftZero = function (str, nz) {
	str = '' + str;
	while (str.length < nz) {
		str = '0' + str;
	}
	return str;
};

Tools.fillWithRightZero = function (str, nz) {
	str = '' + str;
	while (str.length < nz) {
		str = str + '0';
	}
	return str;
};

Tools.getTimeString = function (time) {
	var date = new Date(time || Date.now());
	return ('[' + Tools.fillWithLeftZero(date.getHours(), 2) + ':' + Tools.fillWithLeftZero(date.getMinutes(), 2) + ':' +
		Tools.fillWithLeftZero(date.getSeconds(), 2) + ']');
};

Tools.parseChatMsg = function (msg) {
	return Tools.escapeHTML(msg);
};

Tools.getCookie = function (cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
};

