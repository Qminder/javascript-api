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
    console.log("TODO: Should play alert sound");
  };
}

var QminderBridge = new QminderBridge();
