describe("Lines", function() {

  "use strict";

  var line = null;

  beforeEach(function(done) {
    Qminder.setKey(QMINDER_SECRET_KEY);
    line = null;
    
    Qminder.locations.list(function(r) {
      var location = r.data[0];
        
      Qminder.locations.createLine(location.id, "Temp Line", function(r) {
        line = r.id;
        done();
      });
    });
  });
  
  afterEach(function(done) {
  
    if (line === null) {
      done();
      return;
    }
    
    Qminder.lines.delete(line, function() {
      done();
    });
    
  });
  
  // https://www.qminder.com/docs/api/lines/#details
  it("should throw exception for missing id in details call", function() {
    
    expect(Qminder.lines.details).toThrow("Line ID not provided");

  });
  
  // https://www.qminder.com/docs/api/lines/#details
  it("should throw exception for missing callback in details call", function() {
  
    var call = function() {
      Qminder.lines.details(123);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // https://www.qminder.com/docs/api/lines/#details
  it("should get details", function(done) {
  
    Qminder.lines.details(line, function(response) {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBe(null);
      expect(response.name).not.toBe(null);
      done();
    });
  });
  
  // https://www.qminder.com/docs/api/lines/#resetting
  it("should throw exception for missing id in delete call", function() {
    
    expect(Qminder.lines.delete).toThrow("Line ID not provided");

  });
  
  // https://www.qminder.com/docs/api/lines/#deleting
  it("should delete a line", function(done) {
  
    Qminder.lines.delete(line, function(response) {
      expect(response.statusCode).toBe(200);
      line = null;
      done();
    });
  });
  
  // https://www.qminder.com/docs/api/lines/#estimated-time-of-service
  it("should throw exception for missing id in estimated time call", function() {
    
    expect(Qminder.lines.estimatedTime).toThrow("Line ID not provided");

  });
  
  // https://www.qminder.com/docs/api/lines/#estimated-time-of-service
  it("should throw exception for missing callback in estimated time call", function() {
  
    var call = function() {
      Qminder.lines.estimatedTime(123);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // https://www.qminder.com/docs/api/lines/#estimated-time-of-service
  it("should get estimated time of service", function(done) {
  
    Qminder.lines.estimatedTime(line, function(response) {
      expect(response.statusCode).toBe(200);
      expect(response.estimatedTimeOfService).not.toBe(null);
      expect(response.estimatedPeopleWaiting).not.toBe(null);
      done();
    });
  });
});
