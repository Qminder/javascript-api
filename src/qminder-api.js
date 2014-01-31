/*jshint undef:true */

function Qminder() {

  "use strict";

  var BASE_URL = "https://api.qminderapp.com/v1/";
  var apiKey = null;
  
  this.setKey = function(key) {
    apiKey = key;
  };
  
  this.locations = {
    
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
  
  this.lines = {
  
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
  
  this.tickets = {
  
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
      
      var validParameters = ["location", "line", "status", "minCreated", "maxCreated"];
      
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
  
  // Private
  
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
}

var Qminder = new Qminder();
