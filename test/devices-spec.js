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
  it("should list devices", function(done) {
    
    Qminder.locations.list(function(r) {
      var location = r.data[0];
        
      Qminder.devices.list(location.id, function(response) {
          expect(response.statusCode).toBe(200);
          done();
        });
    });
  });
  
  // http://qminderapp.com/docs/api/devices/
  it("should list devices with error handler", function(done) {

    Qminder.locations.list(function(r) {
      var location = r.data[0];
        
      Qminder.devices.list(location.id, function(response) {
          expect(response.statusCode).toBe(200);
          done();
        });
    }, function() {  
    });
  });
});