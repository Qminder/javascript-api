describe("Qminder API", function() {
  var player;
  var song;

  beforeEach(function() {
    QminderAPI.setSecretKey(QMINDER_SECRET_KEY);
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
    }, "API call did not return in time", 1000);
    
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
