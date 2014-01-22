function QminderBridge() {

	var receiveMessage = function(event) {
		if (event.data.secretKey) {
			QminderBridge.secretKey = event.data.secretKey;
			if (QminderBridge.onLoadCallback) {
				QminderBridge.onLoadCallback();
			}
		}
	};

	window.addEventListener("message", receiveMessage, false);
	
	this.getApiSecretKey = function() {
		return this.secretKey;
	};
	
	this.onLoad = function(callback) {
		this.onLoadCallback = callback;
	};
};

var QminderBridge = new QminderBridge();
