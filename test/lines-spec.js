describe("Lines", function() {

  "use strict";

  var line = null;

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
    line = null;
  });
  
  afterEach(function() {
  
    if (line === null) {
      return;
    }
    
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
  
  // http://www.qminderapp.com/docs/api/lines/#watchcreated
  it("should throw exception for missing id in creation watching call", function() {
    
    expect(Qminder.lines.watchCreated).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/lines/#watchcalled
  it("should throw exception for missing id in call watching call", function() {
    
    expect(Qminder.lines.watchCalled).toThrow("Line ID not provided");

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
  
    createLine();
  
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
  
    createLine();
  
    var response = null;
    
    runs(function() {
      Qminder.lines.delete(line, function(r) {
        response = r;
        line = null;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(response.statusCode).toBe(200);
    });
  });
  
  var createLine = function() {
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
  };
  
});
