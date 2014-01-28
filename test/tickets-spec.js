describe("Tickets", function() {

  "use strict";

  var line = null;

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
    line = null;
    
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
    
  });
  
  afterEach(function() {
    
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

  

  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket", function() {
  
    var response = null;
  
    runs(function() {
      Qminder.tickets.create(line, null, function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBe(null);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with phone number", function() {
  
    var number = 123456;
    createTicket({"phoneNumber": number}, function(response) {
      expect(response.phoneNumber).toBe(number);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with first name", function() {
  
    var name = "Good Guy Greg";
    createTicket({"firstName": name}, function(response) {
      expect(response.firstName).toBe(name);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with both names", function() {
  
    createTicket({"firstName": "Milli", "lastName": "Mallikas"}, function(response) {
      expect(response.firstName).toBe("Milli");
      expect(response.lastName).toBe("Mallikas");
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with last name", function() {
  
    var name = "Scumbag Steve";
    createTicket({"lastName": name}, function(response) {
      expect(response.lastName).toBe(name);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with extra parameters", function() {
  
    var extra = [
      {
        "title": "ID Code",
        "value": "1234567890"
      },
      {
        "title":  "Website",
        "value":  "CNN website",
        "url":  "http://edition.cnn.com"
      }
    ];
    
    createTicket({"extra": extra}, function(response) {
      expect(response.extra).not.toBe(null);
      expect(response.extra.length).toBe(2);
      
      var idCode = response.extra[0];
      expect(idCode.title).toBe("ID Code");
      expect(idCode.value).toBe("1234567890");
      expect(idCode.value.url).not.toBeDefined();
      
      var website = response.extra[1];
      expect(website.title).toBe("Website");
      expect(website.value).toBe("CNN website");
      expect(website.url).toBe("http://edition.cnn.com");
    });

  });

  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets with no filters", function() {
  
    searchTickets(null, function(response) {
      expect(response.data.length).toBeGreaterThan(0);
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets from location", function() {
  
    var location = null;
  
    runs(function() {
      Qminder.locations.list(function(r) {
        location = r.data[0];
      });
    });
    
    waitsFor(function() {
        return location !== null;
      }, "API call did not return in time", 10000);
      
      
    runs(function() {
      searchTickets({"location": location.id}, function(response) {
        expect(response.data.length).toBeGreaterThan(0);
      });
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets from line", function() {
      
    runs(function() {
      searchTickets({"line": line}, function(response) {
        expect(response.data.length).toBeGreaterThan(0);
      });
    });
    
  });
  
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search new tickets", function() {
      
    runs(function() {
      searchTickets({"status": "NEW"}, function(response) {
        expect(response.data.length).toBeGreaterThan(0);
      });
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search called tickets", function() {

    runs(function() {
      searchTickets({"line": line, "status": "CALLED"}, function(response) {
        expect(response.data.length).toBe(0);
      });
    });
    
  });
  
  
  
  var createTicket = function(parameters, callback) {
    var createResponse = null;
    var detailsResponse = null;
  
    runs(function() {
      Qminder.tickets.create(line, parameters, function(r) {
        createResponse = r;
        
        Qminder.tickets.details(createResponse.id, function(r) {
          detailsResponse = r;
        });
      });
    });
    
    waitsFor(function() {
      return detailsResponse !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(createResponse.statusCode).toBe(200);
      expect(createResponse.id).not.toBe(null);
      
      expect(detailsResponse.statusCode).toBe(200);
      expect(detailsResponse.id).toBe(createResponse.id);
      expect(detailsResponse.status).toBe("NEW");
      expect(detailsResponse.created.date).not.toBe(null);
      callback(detailsResponse);
    });

  };
  
  var searchTickets = function(parameters, callback) {
    createTicket(null, function() {
      var response = null;
  
      runs(function() {
        Qminder.tickets.search(parameters, function(r2) {
          response = r2;
        });
      });
      
      waitsFor(function() {
        return response !== null;
      }, "API call did not return in time", 10000);
    
      runs(function() {
        expect(response.statusCode).toBe(200);
        callback(response);
      });
    });
  };
    
});
