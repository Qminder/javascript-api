function QminderAPI() {

	this.BASE_URL = "https://api.qminderapp.com/v1/";
	
	this.setSecretKey = function(key) {
		this.secretKey = key;
	};
	
	this.locations = {
		
		list: function(callback) {
			QminderAPI.createRequest("locations/", null, callback);
		},
		
		lines: function(location, callback) {
			QminderAPI.createRequest("locations/" + location + "/lines", null, callback);
		}
	};
	
	this.tickets = {
		call: function(lines, user, callback) {
			var data = "lines=" + lines + "&user=" + user;
			QminderAPI.createRequest("tickets/call", data, callback);
		},
		
		details: function(id, callback) {
			QminderAPI.createRequest("tickets/" + id, null, callback);
		}
	};
	
	// Private
	
	this.createRequest = function(url, data, callback) {
		var method = "GET";
		if (data) {
			method = "POST";
		}

		var request = this.createCORSRequest(method, this.BASE_URL + url);
		request.setRequestHeader("X-Qminder-REST-API-Key", this.secretKey);

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

	this.createCORSRequest = function(method, url) {
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
