function QminderBridge() {

  "use strict";
  
  var onLoadCallback = null;

  var receiveMessage = function(event) {
    if (event.data.secretKey) {
      if (onLoadCallback) {
        onLoadCallback(event.data.secretKey);
      }
    }
  };

  window.addEventListener("message", receiveMessage, false);
  
  this.onLoad = function(callback) {
    onLoadCallback = callback;
  };
  
  this.playAlertSound = function() {
    parent.postMessage({"command": "playAlertSound"}, "*");
  };
  
  this.getParameters = function() {
    var url = window.location.search.substring(1);
    var variables = url.split("&");

    var result = {};
    variables.forEach(function(variable) {
      var pair = variable.split("=");
      var id = pair[0];
      var value = decodeURIComponent(pair[1]);
      
      if (typeof result[id] == "undefined") {
        result[id] = value;
      }
      else if (typeof result[id] == "string") {
        result[id] = [result[id], value];
      }
      else {
        result[id].push(value);
      }
    });

    return result;
	};
}

var QminderBridge = new QminderBridge();
