QminderBridge.onLoad(function() {
	var secretKey = QminderBridge.getApiSecretKey();
	QminderAPI.setSecretKey(secretKey);
	QminderAPI.locations.list(function(response) {
		response.data.forEach(function(location) {
			$("body").append("<h2>" + location.name + "</h2><br/>");
		});
	});
});