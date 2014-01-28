describe("Locations", function() {

  "use strict";

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
  });
  
  // http://www.qminderapp.com/docs/api/locations/#list
  it("should throw exception for missing callback in list call", function() {
    
    expect(Qminder.locations.list).toThrow("Callback function not provided");

  });

  // http://www.qminderapp.com/docs/api/locations/#list
  it("should list all locations", function() {
  
    var response = null;
  
    runs(function() {
      Qminder.locations.list(function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.data).not.toBe(null);
      expect(response.data.length).toBeGreaterThan(0);
      response.data.forEach(function(location) {
        expect(location.id).not.toBe(null);
        expect(location.name).not.toBe(null);
      });
    });

  });
  
  // http://www.qminderapp.com/docs/api/locations/#details
  it("should throw exception for missing id in details call", function() {
    
    expect(Qminder.locations.details).toThrow("Location ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/locations/#details
  it("should throw exception for missing callback in details call", function() {
  
    var call = function() {
      Qminder.locations.details(123);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/locations/#details
  it("should return location details", function() {
  
    var response = null;
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.details(location.id, function(r) {
          response = r;
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBe(null);
      expect(response.name).not.toBe(null);
    });

  });
  
  // http://www.qminderapp.com/docs/api/locations/#lines
  it("should throw exception for missing id in line list call", function() {
    
    expect(Qminder.locations.lines).toThrow("Location ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/locations/#lines
  it("should throw exception for missing callback in line list call", function() {
  
    var call = function() {
      Qminder.locations.lines(123);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/locations/#lines
  it("should list all lines", function() {
  
    var response = null;
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.lines(location.id, function(r) {
          response = r;
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.data).not.toBe(null);
      expect(response.data.length).toBeGreaterThan(0);
      response.data.forEach(function(location) {
        expect(location.id).not.toBe(null);
        expect(location.name).not.toBe(null);
      });
    });

  });
  
  // http://www.qminderapp.com/docs/api/locations/#newline
  it("should throw exception for missing id in line creation call", function() {
    
    expect(Qminder.locations.createLine).toThrow("Location ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/locations/#newline
  it("should throw exception for missing name in line creation call", function() {
  
    var call = function() {
      Qminder.locations.createLine(123);
    };
    
    expect(call).toThrow("Name not provided");

  });
  
  // http://www.qminderapp.com/docs/api/locations/#newline
  it("should throw exception for missing callback in line creation call", function() {
  
    var call = function() {
      Qminder.locations.createLine(123, "New Service");
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  
  // http://www.qminderapp.com/docs/api/locations/#newline
  it("should not create a line with too long name", function() {
  
    var response = null;
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.createLine(location.id, "1234567890123456789012345678901", function(r) {
          response = r;
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    runs(function() {
      expect(response.statusCode).toBe(400);
      expect(response.attribute).toBe("name");
      expect(response.message).toBe("Parameter \"name\" is too long");
      expect(response.developerMessage).toBe("Maximum length is 30");
    });

  });
  
  // http://www.qminderapp.com/docs/api/locations/#newline
  it("should create and delete a line", function() {
  
    var createResponse = null;
    var deleteResponse = null;
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.createLine(location.id, "Danger Mice & CO", function(r) {
          createResponse = r;
          
          Qminder.lines.delete(createResponse.id, function(r2) {
            deleteResponse = r2;
          });
        });
      });
    });
    
    waitsFor(function() {
      return deleteResponse !== null;
    }, "API call did not return in time", 10000);
    
    runs(function() {
      expect(createResponse.statusCode).toBe(200);
      expect(createResponse.id).not.toBe(null);
      
      expect(deleteResponse.statusCode).toBe(200);
    });

  });
});
