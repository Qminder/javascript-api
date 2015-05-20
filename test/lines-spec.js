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
  
  // http://www.qminderapp.com/docs/api/lines/#watchcreated
  it("should throw exception for missing id in creation watching call", function() {
    
    expect(Qminder.lines.watchCreated).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#watchcalled
  it("should throw exception for missing id in call watching call", function() {
    
    expect(Qminder.lines.watchCalled).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#resetting
  it("should throw exception for missing id in delete call", function() {
    
    expect(Qminder.lines.delete).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#deleting
  it("should delete a line", function(done) {
  
    Qminder.lines.delete(line, function(response) {
      expect(response.statusCode).toBe(200);
      line = null;
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/lines/#estimated-time-of-service
  it("should throw exception for missing id in estimated time call", function() {
    
    expect(Qminder.lines.estimatedTime).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#estimated-time-of-service
  it("should throw exception for missing callback in estimated time call", function() {
  
    var call = function() {
      Qminder.lines.estimatedTime(123);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#estimated-time-of-service
  it("should get estimated time of service", function(done) {
  
    Qminder.lines.estimatedTime(line, function(response) {
      expect(response.statusCode).toBe(200);
      expect(response.estimatedTimeOfService).not.toBe(null);
      expect(response.estimatedPeopleWaiting).not.toBe(null);
      done();
    });
  });
});
