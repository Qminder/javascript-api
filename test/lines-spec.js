describe("Lines", function() {

  "use strict";

  var line = null;

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
    line = null;
    
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.createLine(location.id, "Temp Line", function(r) {
          line = r.id;
        });
      });
    });
    
    waitsFor(function() {
      return line !== null;
    }, "API call did not return in time", 10000);
    
  });
  
  afterEach(function() {
    
    var response = null;
    
    runs(function() {
      Qminder.lines.delete(line, function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
  });

  // http://www.qminderapp.com/docs/api/lines/#resetting
  it("should throw exception for missing id in resetting call", function() {
    
    expect(Qminder.lines.reset).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#resetting
  it("should throw exception for missing callback in resetting call", function() {
  
    var call = function() {
      Qminder.lines.reset(123);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#resetting
  it("should reset sequence", function() {
  
    var response = null;
  
    runs(function() {
      Qminder.lines.reset(line, function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.result).toBe("success");
    });

  });
  
  // http://www.qminderapp.com/docs/api/lines/#resetting
  it("should throw exception for missing id in delete call", function() {
    
    expect(Qminder.lines.delete).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#deleting
  it("should delete a line", function() {
  
    var response = null;
  
    Qminder.lines.delete(line, function(r) {
      response = r;
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(response.statusCode).toBe(200);
    });
  });
  
  // http://www.qminderapp.com/docs/api/lines/#notification-settings
  it("should throw exception for missing id in notification settings call", function() {
    
    expect(Qminder.lines.notificationSettings).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#notification-settings
  it("should throw exception for missing callback in notification settings call", function() {
  
    var call = function() {
      Qminder.lines.notificationSettings(123);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#notification-settings
  it("should get notification settings", function() {
  
    var response = null;
  
    runs(function() {
      Qminder.lines.notificationSettings(line, function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.pattern).not.toBe(null);
    });

  });
  
  // http://www.qminderapp.com/docs/api/lines/#update-notification-settings
  it("should throw exception for missing id in notification settings update call", function() {
    
    expect(Qminder.lines.updateNotificationSettings).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#update-notification-settings
  it("should throw exception for missing pattern in notification settings update call", function() {
  
    var call = function() {
      Qminder.lines.updateNotificationSettings(123);
    };
    
    expect(call).toThrow("Pattern not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#update-notification-settings
  it("should throw exception for missing callback in notification settings update call", function() {
  
    var call = function() {
      Qminder.lines.updateNotificationSettings(123, "");
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#update-notification-settings
  it("should update notification settings", function() {
  
    var response = null;
    var pattern = "1-5,10,15,20,30-50";
  
    runs(function() {
      Qminder.lines.updateNotificationSettings(line, pattern, function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.pattern).toBe(pattern);
    });

  });
  
});
