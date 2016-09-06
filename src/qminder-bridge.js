
/* exported QminderBridge */
var QminderBridge = (function() {

  "use strict";
  
  var onLoadCallback = null;
  var inputFieldListeners = [];
  var keyboardSubmitListeners = [];
  var activeChangeListeners = [];

  var receiveMessage = function(event) {
    if (event.data.secretKey) {
      if (onLoadCallback) {
        onLoadCallback(event.data.secretKey);
      }
    }
    else if (typeof event.data.inputFieldValue != "undefined") {
      inputFieldListeners.forEach(function(listener) {
        listener(event.data.inputFieldValue);
      });
    }
    else if (event.data.keyboardSubmitted) {
      keyboardSubmitListeners.forEach(function(listener) {
        listener();
      });
    } else if (event.data.activeStatus) {
      activeChangeListeners.forEach(function(listener) {
        listener();
      });
    }

  };

  window.addEventListener("message", receiveMessage, false);
  
  var exports = {};
  exports.onLoad = function(callback) {
    onLoadCallback = callback;
  };
  
  exports.onInputFieldChange = function(callback) {
    inputFieldListeners.push(callback);
  };
  
  exports.onKeyboardSubmit = function(callback) {
    keyboardSubmitListeners.push(callback);
  };
  
  exports.onActiveChange = function(callback) {
    activeChangeListeners.push(callback);
  };
  
  exports.showKeyboard = function(type, maxLength) {
    if (maxLength === undefined) {
      maxLength = 50;
    }
    window.location = "qminder-signin://showKeyboardWithType/" + type + "/" + maxLength;
  };
  
  exports.hideKeyboard = function() {
    window.location = "qminder-signin://hideKeyboard";
  };
  
  exports.clearInputText = function() {
    window.location = "qminder-signin://clearInputText";
  };
  
  exports.setInputText = function(value) {
    window.location = "qminder-signin://setInputText/" + value;
  };
  
  exports.playAlertSound = function() {
    parent.postMessage({"command": "playAlertSound"}, "*");
  };
  
  exports.getParameters = function() {
    var url = window.location.search.substring(1);
    var variables = url.split("&");

    var result = {};
    variables.forEach(function(variable) {
      var pair = variable.split("=");
      var id = pair[0];
      var value = pair[1];
      value = value.replace(/\+/g, "%20");
      value = decodeURIComponent(value);

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

  exports.getSettings = function() {
    var settings = exports.getParameters().settings;
    if (settings) {
    	return JSON.parse(settings);
  	}
  	return null;
  };
  
  return exports;
}());
