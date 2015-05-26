/* exported Qminder */
var Qminder = (function() {

  "use strict";

  var SERVER = "api.qminderapp.com";
  var BASE_URL = "https://" + SERVER + "/v1/";
  var apiKey = null;
  var sslEnabled = true;
  
  var assertExtraParameters = function(parameters) {
    assertTrue(parameters instanceof Array, "Extra parameter has to be an array");
    
    var validFields = ["title", "value", "url"];
    
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
      var response = JSON.parse(responseText);
      if (callback) {
        callback(response);
      }
      else {
        console.log("No callback function specified");
      }
    };


    request.onerror = function(error) {
      if (typeof errorCallback != "undefined") {
        
        if (request.status === 0) {
          error = "Network error";
        }
        
        errorCallback(error);
      }
    };
    
    if (typeof errorCallback != "undefined") {
      request.ontimeout = function() {
        errorCallback("timeout");
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
      request = null;
    }


    return request;
  };
  
  
  // Public
  
  var exports = {};
  
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
  };
  
  exports.locations = {
    
    list: function(callback) {
      assertNotNull(callback, ERRORS.CALLBACK);
      get("locations/", callback);
    },
    
    details: function(id, callback) {
      assertNotNull(id, ERRORS.LOCATION);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("locations/" + id, callback);
    },
    
    lines: function(id, callback) {
      assertNotNull(id, ERRORS.LOCATION);
      assertNotNull(callback, ERRORS.CALLBACK);

      get("locations/" + id + "/lines", callback);
    },
    
    users: function(id, callback) {
      assertNotNull(id, ERRORS.LOCATION);
      assertNotNull(callback, ERRORS.CALLBACK);

      get("locations/" + id + "/users", callback);
    },
    
    createLine: function(location, name, callback) {
      assertNotNull(location, ERRORS.LOCATION);
      assertNotNull(name, "Name not provided");
      assertNotNull(callback, ERRORS.CALLBACK);
    
      var data = "name=" + encodeURIComponent(name);
      postData("locations/" + location + "/lines", data, callback);
    }
  };
  
  exports.lines = {
  
    // DEPRECATED
    watchCreated: function(line, lastKnownTicket, callback) {
      assertNotNull(line, ERRORS.LINE);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var url = "lines/" + line + "/watch/created";
      if (lastKnownTicket !== null) {
        url += "?lastKnownTicket=" + lastKnownTicket;
      }
      
      get(url, callback);
    },
  
    // DEPRECATED
    watchCalled: function(line, lastKnownTicket, callback) {
      assertNotNull(line, ERRORS.LINE);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var url = "lines/" + line + "/watch/called";
      if (lastKnownTicket !== null) {
        url += "?lastKnownTicket=" + lastKnownTicket;
      }
      
      get(url, callback);
    },
  
    "delete": function(line, callback) {
      assertNotNull(line, ERRORS.LINE);
      
      deleteRequest("lines/" + line, callback);
    },
    
    estimatedTime: function(line, callback) {
      assertNotNull(line, ERRORS.LINE);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      get("lines/" + line + "/estimated-time", callback);
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

          data += JSON.stringify(value);
        }
        else {
          data += encodeURIComponent(value);
        }
      }
    
      postData("lines/" + line + "/ticket", data, callback, errorCallback);
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
  
    callNext: function(parameters, callback) {
      assertNotNull(parameters, ERRORS.PARAMETERS);
      assertNotNull(parameters.lines, "List of lines not provided");
      assertNotNull(parameters.user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var data = "lines=" + parameters.lines + "&user=" + parameters.user;
      
      if (typeof parameters.desk != "undefined") {
        data += "&desk=" + parameters.desk;
      }
      
      postData("tickets/call", data, callback);
    },
    
    call: function(parameters, callback) {
      assertNotNull(parameters, ERRORS.PARAMETERS);
      assertNotNull(parameters.id, ERRORS.TICKET);
      assertNotNull(parameters.user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var data = "user=" + parameters.user;
      
      if (typeof parameters.desk != "undefined") {
        data += "&desk=" + parameters.desk;
      }
      
      postData("tickets/" + parameters.id + "/call", data, callback);
    },
    
    recall: function(id, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      post("tickets/" + id + "/recall", callback);
    },
    
    edit: function(id, parameters, user, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(parameters, ERRORS.PARAMETERS);
      assertTrue(typeof parameters == "object", ERRORS.PARAMETEROBJECT);
      assertNotNull(user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);
      
      var data = "user=" + user;
      var validParameters = ["phoneNumber", "firstName", "lastName"];
    
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
        data += encodeURIComponent(value);
      }
    
      postData("tickets/" + id + "/edit", data, callback);
    },
    
    markServed: function(id, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      post("tickets/" + id + "/markserved", callback);
    },
    
    markNoShow: function(id, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      post("tickets/" + id + "/marknoshow", callback);
    },
    
    cancel: function(id, user, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);

      var data = "user=" + user;
      postData("tickets/" + id + "/cancel", data, callback);
    },
    
    addLabel: function(id, value, user, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(value, "Value not provided");
      assertNotNull(user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);

      var data = "user=" + user + "&value=" + encodeURIComponent(value);
      postData("tickets/" + id + "/labels/add", data, callback);
    },
    
    removeLabel: function(id, value, user, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(value, "Value not provided");
      assertNotNull(user, ERRORS.USER);
      assertNotNull(callback, ERRORS.CALLBACK);

      var data = "user=" + user + "&value=" + encodeURIComponent(value);
      postData("tickets/" + id + "/labels/remove", data, callback);
    },
    
    details: function(id, callback) {
      assertNotNull(id, ERRORS.TICKET);
      assertNotNull(callback, ERRORS.CALLBACK);

      get("tickets/" + id, callback);
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
    
    var openSocket = function() {
      
      if (!apiKey) {
        throw "Key not set. Please call Qminder.setKey before calling any other methods";
      }
      
      openingConnection = true;
      
      // Samsung Smart-TVs (2013) crashes with SSL
      var supportsSSL = navigator.userAgent.match(/SMART-TV/i) === null;
      
      var protocol = sslEnabled && supportsSSL ? "wss" : "ws";
      socket = new WebSocket(protocol + "://" + SERVER + "/events?rest-api-key=" + apiKey);
      
      socket.onopen = function() {
        console.log("Connection opened");
        connectionOpen = true;
        
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
        
        console.log("Connection closed, Trying to reconnect in 5 seconds");
        setTimeout(openSocket, 5000);
        
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

if (typeof module != "undefined") {
  module.exports = exports = Qminder;
}
