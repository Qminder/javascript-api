// Nodejs support
if (typeof XMLHttpRequest == "undefined" && typeof require != "undefined") {
  var XMLHttpRequest = require("xhr2");
}

/* exported Qminder */
var Qminder = (function() {

  "use strict";

  var SERVER = "api.qminder.com";
  var BASE_URL = "https://" + SERVER + "/v1/";
  var apiKey = null;
  var sslEnabled = true;
  
  var assertExtraParameters = function(parameters) {
    assertTrue(parameters instanceof Array, "Extra parameter has to be an array");
    
    var validFields = ["title", "value", "url", "color"];
    
    parameters.forEach(function(extraParameter) {
      assertTrue(typeof extraParameter === "object", "All extra parameters have to be objects");
      for (var key in extraParameter) {
        if (!extraParameter.hasOwnProperty(key)) {
          continue;
        }
        
        if (validFields.indexOf(key) == -1) {
          throw "Extra parameter field \"" + key + "\" is unknown and should not be used. Valid fields: " + JSON.stringify(validFields);
        }
      }
    });
    
  };
  
  var ERRORS = {
    CALLBACK: "Callback function not provided",
    LOCATION: "Location ID not provided",
    LINE: "Line ID not provided",
    PARAMETEROBJECT: "Parameter has to be an object",
    PARAMETERS: "Parameters not provided",
    USER: "User ID not provided",
    TICKET: "Ticket ID not provided"
  };
  
  // Common
  
  var assertNotNull = function(value, message) {
    if (typeof value === "undefined" || value === null) {
      throw message;
    }
  };
  
  var assertTrue = function(value, message) {
    if (!value) {
      throw message;
    }
  };
  
  var get = function(url, callback, errorCallback) {
    request("GET", url, null, callback, errorCallback);
  };
  
  var post = function(url, callback, errorCallback) {
    request("POST", url, null, callback, errorCallback);
  };
  
  var postData = function(url, data, callback, errorCallback) {
    request("POST", url, data, callback, errorCallback);
  };
  
  var deleteRequest = function(url, callback, errorCallback) {
    request("DELETE", url, null, callback, errorCallback);
  };
  
  var request = function(method, url, data, callback, errorCallback) {
    var request = createCORSRequest(method, BASE_URL + url);
    
    if (!apiKey) {
      throw "Key not set. Please call Qminder.setKey before calling any other methods";
    }

    request.setRequestHeader("X-Qminder-REST-API-Key", apiKey);

    request.onload = function() {
      var responseText = request.responseText;
      try {
        var response = JSON.parse(responseText);
        
        if (callback) {
          callback(response);
        }
        else {
          console.log("No callback function specified");
        }
      } catch (error) {
        if (errorCallback) {
          errorCallback("JSON parse error", request, error);
        }
      }
    };


    request.onerror = function(error) {
      if (typeof errorCallback != "undefined") {
        var errorMessage = "Something went wrong";
        
        if (request.status === 0) {
          errorMessage = "Network error";
        }
        
        errorCallback(errorMessage, request, error);
      }
    };
    
    if (typeof errorCallback != "undefined") {
      request.ontimeout = function(error) {
        errorCallback("timeout", request, error);
      };
    }

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
      request.open(method, url, true);
    }


    return request;
  };
  
  
  // Public
  
  var exports = {};
  
  exports.version = "1.0.3";
  
  exports.setKey = function(key) {
    apiKey = key;
  };
  
  // Normally should not be used
  exports.setServer = function(newServer) {
    var protocol = sslEnabled ? "https" : "http";
    BASE_URL = protocol + "://" + newServer + "/v1/";
    SERVER = newServer;
  };
  
  exports.setSslEnabled = function(enabled) {
    sslEnabled = enabled;
    exports.setServer(SERVER);
  };
  
  exports.locations = {
    
    list: function(callback, errorCallback) {
      assertNotNull(callback, ERRORS.CALLBACK);
      get("locations/", callback, errorCallback);
    },
    
    details: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.LOCATION);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("locations/" + id, callback, errorCallback);
    },
    
    lines: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.LOCATION);
      assertNotNull(callback, ERRORS.CALLBACK);

      get("locations/" + id + "/lines", callback, errorCallback);
    },
    
    users: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.LOCATION);
      assertNotNull(callback, ERRORS.CALLBACK);

      get("locations/" + id + "/users", callback, errorCallback);
    },
    
    createLine: function(location, name, callback, errorCallback) {
      assertNotNull(location, ERRORS.LOCATION);
      assertNotNull(name, "Name not provided");
      assertNotNull(callback, ERRORS.CALLBACK);
    
      var data = "name=" + encodeURIComponent(name);
      postData("locations/" + location + "/lines", data, callback, errorCallback);
    }
  };
  
  exports.lines = {
  
    details: function(line, callback, errorCallback) {
      assertNotNull(line, ERRORS.LINE);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("lines/" + line, callback, errorCallback);
    },
  
    "delete": function(line, callback, errorCallback) {
      assertNotNull(line, ERRORS.LINE);
      
      deleteRequest("lines/" + line, callback, errorCallback);
    },
    
    estimatedTime: function(line, callback, errorCallback) {
      assertNotNull(line, ERRORS.LINE);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("lines/" + line + "/estimated-time", callback, errorCallback);
    }
  };
  
  exports.tickets = {
  
    create: function(line, parameters, callback, errorCallback) {
      assertNotNull(line, ERRORS.LINE);
      assertTrue(typeof parameters == "object", ERRORS.PARAMETEROBJECT);
      assertNotNull(callback, ERRORS.CALLBACK);
    
      var data = null;
      var validParameters = ["source", "phoneNumber", "firstName", "lastName", "extra"];
      var validSources = ["IPHONE", "ANDROID", "MANUAL", "NAME", "PRINTER"];
    
      for (var key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }
        if (validParameters.indexOf(key) == -1) {
          throw "Parameter \"" + key + "\" is unknown and should not be used. Valid parameters: " + JSON.stringify(validParameters);
        }
          
        var value = parameters[key];
        
        if (key == "source" && validSources.indexOf(value) == -1) {
          throw "Source is invalid. Valid values: " + JSON.stringify(validSources);
        }
        
        data += "&" + key + "=";
          
        if (key == "extra") {
          assertExtraParameters(value);

          data += encodeURIComponent(JSON.stringify(value));
        }
        else {
          data += encodeURIComponent(value);
        }
      }
    
      postData("lines/" + line + "/ticket", data, callback, errorCallback);
    },
    
    auditLogs: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("tickets/" + id + "/audit", callback, errorCallback);
    },
    
    search: function(parameters, callback, errorCallback) {
      assertTrue(typeof parameters == "object", ERRORS.PARAMETEROBJECT);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var url = "tickets/search?";
      
      var validParameters = ["location", "line", "status", "caller", "minCreated", "maxCreated", "minCalled", "maxCalled", "limit", "order"];
      
      for (var key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }
        if (validParameters.indexOf(key) == -1) {
          throw "Parameter \"" + key + "\" is unknown and should not be used. Valid parameters: " + JSON.stringify(validParameters);
        }
        url += "&" + key + "=" + encodeURIComponent(parameters[key]);
      }
      
      get(url, callback, errorCallback);
    },
  
    callNext: function(parameters, callback, errorCallback) {
      assertNotNull(parameters, ERRORS.PARAMETERS);
      assertNotNull(parameters.lines, "List of lines not provided");
      assertNotNull(parameters.user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var data = "lines=" + parameters.lines + "&user=" + parameters.user;
      
      if (typeof parameters.desk != "undefined") {
        data += "&desk=" + parameters.desk;
      }
      
      postData("tickets/call", data, callback, errorCallback);
    },
    
    call: function(parameters, callback, errorCallback) {
      assertNotNull(parameters, ERRORS.PARAMETERS);
      assertNotNull(parameters.id, ERRORS.TICKET);
      assertNotNull(parameters.user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var data = "user=" + parameters.user;
      
      if (typeof parameters.desk != "undefined") {
        data += "&desk=" + parameters.desk;
      }
      
      postData("tickets/" + parameters.id + "/call", data, callback, errorCallback);
    },
    
    recall: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      post("tickets/" + id + "/recall", callback, errorCallback);
    },
    
    edit: function(id, parameters, user, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(parameters, ERRORS.PARAMETERS);
      assertTrue(typeof parameters == "object", ERRORS.PARAMETEROBJECT);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var data = "";
      
      var validParameters = ["line", "user", "phoneNumber", "firstName", "lastName", "extra"];
    
      if (user) {
        data += "user=" + user;
      }
    
      for (var key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }
        if (validParameters.indexOf(key) == -1) {
          throw "Parameter \"" + key + "\" is unknown and should not be used. Valid parameters: " + JSON.stringify(validParameters);
        }
          
        var value = parameters[key];
        if (typeof value == "undefined") {
          continue;
        }
        
        data += "&" + key + "=";
        
        if (key == "extra") {
          assertExtraParameters(value);

          data += encodeURIComponent(JSON.stringify(value));
        }
        else {
          data += encodeURIComponent(value);
        }
      }
    
      postData("tickets/" + id + "/edit", data, callback, errorCallback);
    },
    
    markServed: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      post("tickets/" + id + "/markserved", callback, errorCallback);
    },
    
    markNoShow: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      post("tickets/" + id + "/marknoshow", callback, errorCallback);
    },
    
    cancel: function(id, user, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);

      var data = "user=" + user;
      postData("tickets/" + id + "/cancel", data, callback, errorCallback);
    },
    
    assign: function(id, assigner, assignee, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(assigner, "User ID of assigner not provided");
      assertNotNull(assignee, "User ID of assignee not provided");
      assertNotNull(callback, ERRORS.CALLBACK);

      var data = "assigner=" + assigner;
      data += "&assignee=" + assignee;
      postData("tickets/" + id + "/assign", data, callback, errorCallback);
    },
    
    reorder: function(id, after, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      var data = null;
      if (after !== null) {
        data = "after=" + after;
      }
      postData("tickets/" + id + "/reorder", data, callback, errorCallback);
    },
    
    addLabel: function(id, value, user, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(value, "Value not provided");
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var data = "value=" + encodeURIComponent(value);
      
      if (user) {
        data += "&user=" + user;
      }
      
      postData("tickets/" + id + "/labels/add", data, callback, errorCallback);
    },
    
    removeLabel: function(id, value, user, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(value, "Value not provided");
      assertNotNull(user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);

      var data = "user=" + user + "&value=" + encodeURIComponent(value);
      postData("tickets/" + id + "/labels/remove", data, callback, errorCallback);
    },
    
    details: function(id, callback, errorCallback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      get("tickets/" + id, callback, errorCallback);
    }
  };
  
  exports.users = {
  
    create: function(parameters, callback, errorCallback) {
      assertNotNull(parameters, "Parameters not provided");
      assertTrue(typeof parameters == "object", ERRORS.PARAMETEROBJECT);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var requiredParameters = ["email", "firstName", "lastName", "roles"];
      var data = null;
      
      for (var key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }

        if (requiredParameters.indexOf(key) == -1) {
          throw "Parameter \"" + key + "\" is unknown and should not be used. Valid parameters: " + JSON.stringify(requiredParameters);
        }
        
        data += "&" + key + "=";
        var value = parameters[key];
        
        if (key == "roles") {
          data += encodeURIComponent(JSON.stringify(value));
        }
        else {
          data += encodeURIComponent(value);
        }
      }
      
      requiredParameters.forEach(function(parameter) {
      
        var found = false;
      
        for (key in parameters) {
          if (!parameters.hasOwnProperty(key)) {
            continue;
          }
          
          if (key == parameter) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          throw "Parameter \"" + parameter + "\" is mandatory.";
        }
      });
      
      postData("users", data, callback, errorCallback);
    
    },
    
    addRole: function(user, parameters, callback, errorCallback) {
      assertNotNull(user, ERRORS.USER);
      assertNotNull(parameters, "Parameters not provided");
      assertTrue(typeof parameters == "object", ERRORS.PARAMETEROBJECT);
      
      var validParameters = ["type", "location"];
      var requiredParameters = ["type"];
      var data = null;
      
      for (var key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }

        if (validParameters.indexOf(key) == -1) {
          throw "Parameter \"" + key + "\" is unknown and should not be used. Valid parameters: " + JSON.stringify(validParameters);
        }
        
        data += "&" + key + "=" + encodeURIComponent(parameters[key]);
      }
      
      requiredParameters.forEach(function(parameter) {
      
        var found = false;
      
        for (key in parameters) {
          if (!parameters.hasOwnProperty(key)) {
            continue;
          }
          
          if (key == parameter) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          throw "Parameter \"" + parameter + "\" is mandatory.";
        }
      });
      
      if ((parameters.type == "CLERK" || parameters.type == "MANAGER") && !parameters.hasOwnProperty("location")) {
        throw "Parameter \"location\" is required when type is \"" + parameters.type + "\"";
      }
      
      postData("users/" + user + "/roles", data, callback, errorCallback);
    
    },
    
    "delete": function(user, callback, errorCallback) {
      assertNotNull(user, ERRORS.USER);
      deleteRequest("users/" + user, callback, errorCallback);
    },
    
    details: function(user, callback, errorCallback) {
      assertNotNull(user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("users/" + user, callback, errorCallback);
    }
  };
  
  exports.devices = {
    list: function(location, callback, errorCallback) {
      assertNotNull(location, ERRORS.LOCATION);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("locations/" + location + "/devices", callback, errorCallback);
    }
  };
  
  
  // Events
  
  exports.events = (function() {
    
    var connectionOpen = false;
    var openingConnection = false;
    var pingInterval = null;

    var socket = null;
    var messageHistory = [];
    var messageQueue = [];
    var callbackMap = {};
    
    var onConnectedCallback = null;
    var onDisconnectedCallback = null;
    
    var socketRetriedConnections = 0;
    
    var createId = function() {
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var text = "";
      
      for (var i=0; i<30; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };
    
    var sendMessage = function(message, callback) {
      if (typeof callback !== "undefined") {
        callbackMap[message.id] = callback;
      }
      console.log("Sending: " + JSON.stringify(message));
      socket.send(JSON.stringify(message));
    };
    
    var autoReopenTimeout = null;
    
    var openSocket = function() {
      
      if (!apiKey) {
        throw "Key not set. Please call Qminder.setKey before calling any other methods";
      }
      
      openingConnection = true;
      
      if (autoReopenTimeout) {
        clearTimeout(autoReopenTimeout);
      }
      
      // Samsung Smart-TVs (2013) crashes with SSL
      var supportsSSL = navigator.userAgent.match(/SMART-TV/i) === null;
      
      var protocol = sslEnabled && supportsSSL ? "wss" : "ws";
      socket = new WebSocket(protocol + "://" + SERVER + "/events?rest-api-key=" + apiKey);
      
      socket.onopen = function() {
        console.log("Connection opened");
        connectionOpen = true;
        socketRetriedConnections = 0;
        messageHistory.forEach(function(message) {
          sendMessage(message);
        });
        
        while (messageQueue.length > 0) {
          var queueItem = messageQueue.pop();
          sendMessage(queueItem.message, queueItem.callback);
          messageHistory.push(queueItem.message);
        }
        
        pingInterval = setInterval(function(){
          socket.send("PING");
        }, 10000);
        
        if (onConnectedCallback !== null) {
          onConnectedCallback();
        }
      };
      
      socket.onclose = function() {
        connectionOpen = false;
        openingConnection = false;
        
        if (pingInterval !== null) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        
        var timeoutMult = Math.floor(socketRetriedConnections / 10);
        var newTimeout = Math.min(5000 + timeoutMult * 1000, 60000);
        console.log("Connection closed, Trying to reconnect in " + newTimeout/1000 + " seconds");
        
        if (autoReopenTimeout) {
          clearTimeout(autoReopenTimeout);
        }
        autoReopenTimeout = setTimeout(openSocket, newTimeout);
        socketRetriedConnections++;

        if (onDisconnectedCallback !== null) {
          onDisconnectedCallback();
        }
      };
      
      socket.onerror = function(error) {
        console.log("Error: ", error);
      };
      
      socket.onmessage = function(rawMessage) {
        var message = JSON.parse(rawMessage.data);
        var callback = callbackMap[message.subscriptionId];
        callback(message.data);
      };
      
    };
    
    var send = function(message, callback) {
      if (connectionOpen) {
        sendMessage(message, callback);
        messageHistory.push(message);
      }
      else {
        messageQueue.push({message: message, callback: callback});
        if (!openingConnection) {
          openSocket();
        }
      }
    };
    
    var subscribe = function(a, b, eventName) {
      var filter = a;
      var callback = b;
      
      if (typeof callback === "undefined") {
        callback = a;
        filter = null;
      }
      
      var message = {
          id: createId(),
          subscribe : eventName
        };

      if (filter !== null) {
        if (typeof filter.line !== "undefined") {
          message.line = filter.line;
        }
        else if (typeof filter.location !== "undefined") {
          message.location = filter.location;
        }
      }
      
      send(message, callback);
    };
    
    var exports = {};
    
    exports.onConnected = function(callback) {
      onConnectedCallback = callback;
    };
    
    exports.tryConnect  = function() {
      if (connectionOpen || openingConnection) {
        return false;
      }
      openSocket();
    };
    
    exports.onDisconnected = function(callback) {
      onDisconnectedCallback = callback;
    };
    
    // filter, callback
    exports.onTicketCreated = function(a, b) {
      subscribe(a, b, "TICKET_CREATED");
    };
    
    // filter, callback
    exports.onTicketCalled = function(a, b) {
      subscribe(a, b, "TICKET_CALLED");
    };
    
    // filter, callback
    exports.onTicketRecalled = function(a, b) {
      subscribe(a, b, "TICKET_RECALLED");
    };
    
    // filter, callback
    exports.onTicketCancelled = function(a, b) {
      subscribe(a, b, "TICKET_CANCELLED");
    };
    
    // filter, callback
    exports.onTicketServed = function(a, b) {
      subscribe(a, b, "TICKET_SERVED");
    };
    
    // filter, callback
    exports.onTicketChanged = function(a, b) {
      subscribe(a, b, "TICKET_CHANGED");
    };
    
    // id, callback
    exports.onOverviewMonitorChange = function(monitorId, callback) {
    
      var message = {
          id: createId(),
          subscribe : "OVERVIEW_MONITOR_CHANGE",
          parameters: {id: monitorId}
        };

      send(message, callback);
    };
    
    exports.onSignInDeviceChange = function(signInDeviceId, callback) {
    
      var message = {
          id: createId(),
          subscribe : "SIGN_IN_CHANGE",
          parameters: {id: signInDeviceId}
        };

      send(message, callback);
    };
    
    exports.onLinesChanged = function(locationId, callback) {
      var message = {
          id: createId(),
          subscribe : "LINES_CHANGED",
          parameters: {id: locationId}
        };

      send(message, function(response) {
        callback(response.lines);
      });
    };
    
    return exports;
    
  }());
  
  return exports;
  
}());

// Nodejs support
if (typeof module != "undefined") {
  module.exports = exports = Qminder;
}

if (typeof window != "undefined") {
  window.Qminder = Qminder;
}
