/*jslint browser: true */

function QminderAPI() {

	"use strict";

	var BASE_URL = "https://api.qminderapp.com/v1/";
	var secretKey = null;
	
	this.setSecretKey = function(key) {
		secretKey = key;
	};
	
	this.locations = {
		
		list: function(callback) {
			createRequest("locations/", null, callback);
		},
		
		details: function(id, callback) {
			createRequest("locations/" + id, null, callback);
		},
		
		lines: function(location, callback) {
			createRequest("locations/" + location + "/lines", null, callback);
		}
	};
	
	this.tickets = {
		call: function(lines, user, callback) {
			var data = "lines=" + lines + "&user=" + user;
			createRequest("tickets/call", data, callback);
		},
		
		details: function(id, callback) {
			createRequest("tickets/" + id, null, callback);
		}
	};
	
	// Private
	
	var createRequest = function(url, data, callback) {
		var method = "GET";
		if (data) {
			method = "POST";
		}

		var request = createCORSRequest(method, BASE_URL + url);

		request.setRequestHeader("X-Qminder-REST-API-Key", secretKey);

		request.onload = function() {
			var responseText = request.responseText;
			var response = JSON.parse(responseText);
			if (callback) {
				callback(response);
			}
			else {
				console.log("No callback function specified");
			}
		};

		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		request.send(data);
	};

	var createCORSRequest = function(method, url) {
		var request = new XMLHttpRequest();
		if ("withCredentials" in request) {
			request.open(method, url, true);
		}
		else if (typeof XDomainRequest != "undefined") {
			request = new XDomainRequest();
			request.open(method, url);
		}
		else {
			request = null;
		}


		return request;
	};
}

var QminderAPI = new QminderAPI();
