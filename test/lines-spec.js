describe("Lines", function() {

  var line = null;

  beforeEach(function() {
    QminderAPI.setSecretKey(QMINDER_SECRET_KEY);
    line = null;
    
    runs(function() {
      QminderAPI.locations.list(function(r) {
        var location = r.data[0];
        
        QminderAPI.locations.createLine(location.id, "Temp Line", function(r) {
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
      QminderAPI.lines.delete(line, function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
  });

  

  // http://www.qminderapp.com/docs/api/lines/#resetting
  it("should reset sequence", function() {
  
    var response = null;
  
    runs(function() {
      QminderAPI.lines.reset(line, function(r) {
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
  
  // http://www.qminderapp.com/docs/api/lines/#notification-settings
  it("should get notification settings", function() {
  
    var response = null;
  
    runs(function() {
      QminderAPI.lines.notificationSettings(line, function(r) {
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
  it("should update notification settings", function() {
  
    var response = null;
    var pattern = "1-5,10,15,20,30-50";
  
    runs(function() {
      QminderAPI.lines.updateNotificationSettings(line, pattern, function(r) {
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
