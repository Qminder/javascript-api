describe("Devices", function() {

  "use strict";

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
  });

  // http://qminderapp.com/docs/api/devices/
  it("should throw exception for missing id in device list call", function() {
    
    expect(Qminder.devices.list).toThrow("Location ID not provided");
  });
  
  // http://qminderapp.com/docs/api/devices/
  it("should throw exception for missing callback in device list call", function() {
  
    var call = function() {
      Qminder.devices.list(123);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://qminderapp.com/docs/api/devices/
  it("should list devices", function() {
    
    var response = null;
    
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.devices.list(location.id, function(r) {
            response = r;
          });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);

    runs(function() {
      expect(response.statusCode).toBe(200);
    });
    
  });
  
  // http://qminderapp.com/docs/api/devices/
  it("should list devices with error handler", function() {
    
    var response = null;
    
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.devices.list(location.id, function(r) {
            response = r;
          });
      }, function() {
        
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);

    runs(function() {
      expect(response.statusCode).toBe(200);
    });
    
  });
});