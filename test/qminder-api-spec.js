describe("Qminder API", function() {

  beforeEach(function() {
    QminderAPI.setSecretKey(QMINDER_SECRET_KEY);
  });
  
  function waitsForResponse(response) {
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  }
  
  it("should not show BASE_URL", function() {
  
    expect(QminderAPI.BASE_URL).not.toBeDefined();

  });
  
  it("should not show createRequest", function() {
  
    expect(QminderAPI.createRequest).not.toBeDefined();

  });
  
  it("should not show createCORSRequest", function() {
  
    expect(QminderAPI.createCORSRequest).not.toBeDefined();

  });
  
  it("should not show secretKey", function() {
  
    expect(QminderAPI.secretKey).not.toBeDefined();

  });

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
});
