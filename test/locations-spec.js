describe("Locations", function() {

  beforeEach(function() {
    QminderAPI.setSecretKey(QMINDER_SECRET_KEY);
  });
  

  // http://www.qminderapp.com/docs/api/locations/#list
  it("should list all locations", function() {
  
    var response = null;
  
    runs(function() {
      QminderAPI.locations.list(function(r) {
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
  it("should return location details", function() {
  
    var response = null;
  
    runs(function() {
      QminderAPI.locations.list(function(r) {
        var location = r.data[0];
        
        QminderAPI.locations.details(location.id, function(r) {
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
  
  // http://www.qminderapp.com/docs/api/locations/#details
  it("should list all lines", function() {
  
    var response = null;
  
    runs(function() {
      QminderAPI.locations.list(function(r) {
        var location = r.data[0];
        
        QminderAPI.locations.lines(location.id, function(r) {
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
  it("should not create a line with too long name", function() {
  
    var response = null;
  
    runs(function() {
      QminderAPI.locations.list(function(r) {
        var location = r.data[0];
        
        QminderAPI.locations.createLine(location.id, "1234567890123456789012345678901", function(r) {
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
      QminderAPI.locations.list(function(r) {
        var location = r.data[0];
        
        QminderAPI.locations.createLine(location.id, "Danger Mice & CO", function(r) {
          createResponse = r;
          
          QminderAPI.lines.delete(createResponse.id, function(r2) {
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
