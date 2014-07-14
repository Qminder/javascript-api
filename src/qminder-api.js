/* exported Qminder */
var Qminder = (function() {

  "use strict";

  var BASE_URL = "https://api.qminderapp.com/v1/";
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
  
  var get = function(url, callback) {
    request("GET", url, null, callback);
  };
  
  var post = function(url, callback) {
    request("POST", url, null, callback);
  };
  
  var postData = function(url, data, callback) {
    request("POST", url, data, callback);
  };
  
  var deleteRequest = function(url, callback) {
    request("DELETE", url, null, callback);
  };
  
  var request = function(method, url, data, callback) {
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
  exports.setBaseUrl = function(url) {
    BASE_URL = url;
  };
  
  exports.setSslEnabled = function(enabled) {
    sslEnabled = enabled;
  };
  
  exports.locations = {
    
    list: function(callback) {
      assertNotNull(callback, "Callback function not provided");
      get("locations/", callback);
    },
    
    details: function(id, callback) {
      assertNotNull(id, "Location ID not provided");
      assertNotNull(callback, "Callback function not provided");
      
      get("locations/" + id, callback);
    },
    
    lines: function(id, callback) {
      assertNotNull(id, "Location ID not provided");
      assertNotNull(callback, "Callback function not provided");

      get("locations/" + id + "/lines", callback);
    },
    
    users: function(id, callback) {
      assertNotNull(id, "Location ID not provided");
      assertNotNull(callback, "Callback function not provided");

      get("locations/" + id + "/users", callback);
    },
    
    createLine: function(location, name, callback) {
      assertNotNull(location, "Location ID not provided");
      assertNotNull(name, "Name not provided");
      assertNotNull(callback, "Callback function not provided");
    
      var data = "name=" + encodeURIComponent(name);
      postData("locations/" + location + "/lines", data, callback);
    }
  };
  
  exports.lines = {
  
    watchCreated: function(line, lastKnownTicket, callback) {
      assertNotNull(line, "Line ID not provided");
      assertNotNull(callback, "Callback function not provided");
      
      var url = "lines/" + line + "/watch/created";
      if (lastKnownTicket !== null) {
        url += "?lastKnownTicket=" + lastKnownTicket;
      }
      
      get(url, callback);
    },
  
    watchCalled: function(line, lastKnownTicket, callback) {
      assertNotNull(line, "Line ID not provided");
      assertNotNull(callback, "Callback function not provided");
      
      var url = "lines/" + line + "/watch/called";
      if (lastKnownTicket !== null) {
        url += "?lastKnownTicket=" + lastKnownTicket;
      }
      
      get(url, callback);
    },
  
    reset: function(line, callback) {
      assertNotNull(line, "Line ID not provided");
      assertNotNull(callback, "Callback function not provided");
      
      post("lines/" + line + "/reset", callback);
    },
  
    delete: function(line, callback) {
      assertNotNull(line, "Line ID not provided");
      
      deleteRequest("lines/" + line, callback);
    },
    
    notificationSettings: function(line, callback) {
      assertNotNull(line, "Line ID not provided");
      assertNotNull(callback, "Callback function not provided");
      
      get("lines/" + line + "/settings/notifications/waiting", callback);
    },
    
    updateNotificationSettings: function(line, pattern, callback) {
      assertNotNull(line, "Line ID not provided");
      assertNotNull(pattern, "Pattern not provided");
      assertNotNull(callback, "Callback function not provided");
      
      var data = "pattern=" + encodeURIComponent(pattern);
      postData("lines/" + line + "/settings/notifications/waiting", data, callback);
    }
  };
  
  exports.tickets = {
  
    create: function(line, parameters, callback) {
      assertNotNull(line, "Line ID not provided");
      assertTrue(typeof parameters == "object", "Parameter has to be an object");
      assertNotNull(callback, "Callback function not provided");
    
      var data = null;
      var validParameters = ["phoneNumber", "sendTextMessage", "firstName", "lastName", "extra"];
    
      for (var key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }
        if (validParameters.indexOf(key) == -1) {
          throw "Parameter \"" + key + "\" is unknown and should not be used. Valid parameters: " + JSON.stringify(validParameters);
        }
          
        var value = parameters[key];
        data += "&" + key + "=";
          
        if (key == "extra") {
          assertExtraParameters(value);

          data += JSON.stringify(value);
        }
        else {
          data += encodeURIComponent(value);
        }
      }
    
      postData("lines/" + line + "/ticket", data, callback);
    },
    
    search: function(parameters, callback) {
      assertTrue(typeof parameters == "object", "Parameter has to be an object");
      assertNotNull(callback, "Callback function not provided");
      
      var url = "tickets/search?";
      
      var validParameters = ["location", "line", "status", "minCreated", "maxCreated", "minCalled", "maxCalled", "limit", "order"];
      
      for (var key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }
        if (validParameters.indexOf(key) == -1) {
          throw "Parameter \"" + key + "\" is unknown and should not be used. Valid parameters: " + JSON.stringify(validParameters);
        }
        url += "&" + key + "=" + encodeURIComponent(parameters[key]);
      }
      
      get(url, callback);
    },
  
    call: function(lines, user, callback) {
      assertNotNull(lines, "List of lines not provided");
      assertNotNull(user, "User ID not provided");
      assertNotNull(callback, "Callback function not provided");
      
      var data = "lines=" + lines + "&user=" + user;
      postData("tickets/call", data, callback);
    },
    
    details: function(id, callback) {
      assertNotNull(id, "Ticket ID not provided");
      assertNotNull(callback, "Callback function not provided");

      get("tickets/" + id, callback);
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
      socket = new WebSocket(protocol + "://api.qminderapp.com//events?rest-api-key=" + apiKey);
      
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
          subscribe : eventName,
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
    
    // id, callback
    exports.onOverviewMonitorChange = function(monitorId, callback) {
    
      var message = {
          id: createId(),
          subscribe : "OVERVIEW_MONITOR_CHANGE",
          parameters: {id: monitorId}
        };

      send(message, callback);
    };
    
    return exports;
    
  }());
  
  return exports;
  
}());
