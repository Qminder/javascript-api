describe("Tickets", function() {

  "use strict";

  var line = null;

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
    line = null;
    
  });
  
  afterEach(function() {
  
    if (!line) {
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

  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should throw exception for missing id in create ticket call", function() {
    
    expect(Qminder.tickets.create).toThrow("Line ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should throw exception for missing callback in create ticket call", function() {
  
    var call = function() {
      Qminder.tickets.create(123, null);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should throw exception for invalid parameter in create ticket call", function() {
  
    var call = function() {
      Qminder.tickets.create(123, {"name": "Maali"}, function() {});
    };
    
    expect(call).toThrow("Parameter \"name\" is unknown and should not be used. Valid parameters: [\"phoneNumber\",\"sendTextMessage\",\"firstName\",\"lastName\",\"extra\"]");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should throw exception for invalid parameter type in create ticket call", function() {
  
    var call = function() {
      Qminder.tickets.create(123, "Maali", function() {});
    };
    
    expect(call).toThrow("Parameter has to be an object");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should throw exception for invalid extra parameter type in create ticket call", function() {
  
    var call = function() {
      Qminder.tickets.create(123, {"extra": "Madli"}, function() {});
    };
    
    expect(call).toThrow("Extra parameter has to be an array");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should throw exception for invalid extra parameter in create ticket call", function() {
  
    var call = function() {
      Qminder.tickets.create(123, {"extra": ["Peeter"]}, function() {});
    };
    
    expect(call).toThrow("All extra parameters have to be objects");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should throw exception for invalid extra parameter field in create ticket call", function() {
  
    var call = function() {
      Qminder.tickets.create(123, {"extra": [{"name": "Meeli"}]}, function() {});
    };
    
    expect(call).toThrow("Extra parameter field \"name\" is unknown and should not be used. Valid fields: [\"title\",\"value\",\"url\"]");

  });

  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket", function() {
  
    createLine();
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
  
    createLine();
    var number = 123456;
    createTicket({"phoneNumber": number}, function(response) {
      expect(response.phoneNumber).toBe(number);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with first name", function() {
  
    createLine();
    var name = "Good Guy Greg";
    createTicket({"firstName": name}, function(response) {
      expect(response.firstName).toBe(name);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with both names", function() {
  
    createLine();
    createTicket({"firstName": "Milli", "lastName": "Mallikas"}, function(response) {
      expect(response.firstName).toBe("Milli");
      expect(response.lastName).toBe("Mallikas");
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with last name", function() {
  
    createLine();
    var name = "Scumbag Steve";
    createTicket({"lastName": name}, function(response) {
      expect(response.lastName).toBe(name);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with extra parameters", function() {
  
    createLine();
    
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
  it("should throw exception for missing callback in search call", function() {
  
    var call = function() {
      Qminder.tickets.search(null);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should throw exception for invalid parameter type in search call", function() {
  
    var call = function() {
      Qminder.tickets.search("Juuli");
    };
    
    expect(call).toThrow("Parameter has to be an object");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should throw exception for invalid parameter in search call", function() {
  
    var call = function() {
      Qminder.tickets.search({"name": "Tuuli"}, function() {});
    };
    
    expect(call).toThrow("Parameter \"name\" is unknown and should not be used. Valid parameters: [\"location\",\"line\",\"status\",\"caller\",\"minCreated\",\"maxCreated\",\"minCalled\",\"maxCalled\",\"limit\",\"order\"]");

  });

  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets with no filters", function() {
  
    createLine();
    
    searchTickets(null, function(response) {
      expect(response.data.length).toBeGreaterThan(0);
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets from location", function() {
  
    createLine();
    
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
    
    createLine();
    
    runs(function() {
      searchTickets({"line": line}, function(response) {
        expect(response.data.length).toBeGreaterThan(0);
      });
    });
    
  });
  
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search new tickets", function() {
    
    createLine();
    
    runs(function() {
      searchTickets({"status": "NEW"}, function(response) {
        expect(response.data.length).toBeGreaterThan(0);
      });
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search called tickets", function() {
    
    createLine();
    
    runs(function() {
      searchTickets({"line": line, "status": "CALLED"}, function(response) {
        expect(response.data.length).toBe(0);
      });
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets with limit", function() {
  
    createLine();
    
    runs(function() {
      searchTickets({"limit": 2}, function(response) {
        expect(response.data.length).toBe(2);
      });
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets ordered by id desc", function() {
  
    createLine();
    
    runs(function() {
      searchTickets({"order": "id DESC"}, function(response) {
      
        var id = null;
        response.data.forEach(function(ticket) {
          if (id === null) {
            id = ticket.id;
          }
          else {
            expect(parseInt(id)).toBeGreaterThan(parseInt(ticket.id));
            id = ticket.id;
          }
        });
      });
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should throw exception for missing parameters in calling next ticket", function() {
    
    expect(Qminder.tickets.callNext).toThrow("Parameters not provided");

  });


  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should throw exception for missing lines in calling next ticket", function() {
  
    var call = function() {
      Qminder.tickets.callNext({});
    };
    
    expect(call).toThrow("List of lines not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should throw exception for missing user id in calling next ticket", function() {
  
    var call = function() {
      Qminder.tickets.callNext({"lines": 1});
    };
    
    expect(call).toThrow("User ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should throw exception for missing callback in calling next ticket", function() {
  
    var call = function() {
      Qminder.tickets.callNext({"lines": 1, "user":123});
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should call a ticket - no tickets to call", function() {
  
    createLine();
    var response = null;
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.callNext({"lines":line, "user":userId}, function(r) {
            response = r;
          });
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBeDefined();
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should call next ticket", function() {
  
    createLine();
    var response = null;
    var ticketId = null;
    
    createTicket(null, function(r) {
      ticketId = r.id;
      Qminder.tickets.details(r.id, function(r) {
        response = r;
      });
    });
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.callNext({"lines":line, "user":userId}, function(r) {
            response = r;
          });
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.id).toBeDefined();
      expect(response.id).toBe(ticketId);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should call a ticket from list of lines", function() {
  
    createLine();
    var response = null;
    var ticketId = null;
    
    createTicket(null, function(r) {
      ticketId = r.id;
      Qminder.tickets.details(r.id, function(r) {
        response = r;
      });
    });
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          console.log("Calling ticket");
          Qminder.tickets.callNext({"lines":[line, 123, 234, 453], "user":userId}, function(r) {
            response = r;
          });
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.id).toBeDefined();
      expect(response.id).toBe(ticketId);
    });

  });
  
  // http://qminderapp.com/docs/api/tickets/#calling
  it("should throw exception for missing parameters in calling ticket", function() {
    
    expect(Qminder.tickets.call).toThrow("Parameters not provided");

  });
  
  // http://qminderapp.com/docs/api/tickets/#calling
  it("should throw exception for missing id in calling ticket", function() {
  
    var call = function() {
      Qminder.tickets.call({});
    };
    
    expect(call).toThrow("Ticket ID not provided");

  });
  
  // http://qminderapp.com/docs/api/tickets/#calling
  it("should throw exception for missing user id in calling ticket", function() {
  
    var call = function() {
      Qminder.tickets.call({"id": 1});
    };
    
    expect(call).toThrow("User ID not provided");

  });

  // http://www.qminderapp.com/docs/api/tickets/#calling
  it("should throw exception for missing callback in calling ticket", function() {
  
    var call = function() {
      Qminder.tickets.call({"id": 1, "user":123});
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling
  it("should call ticket", function() {
  
    createLine();
    var response = null;
    var ticketId = null;
    
    createTicket(null, function(r) {
      ticketId = r.id;
    });
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.call({"id":ticketId, "user":userId}, function(r) {
            response = r;
          });
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.id).toBeDefined();
      expect(response.id).toBe(ticketId);
    });

  });
  
  // http://qminderapp.com/docs/api/tickets/#cancelling
  it("should throw exception for missing ticket id in cancellation call", function() {
    
    expect(Qminder.tickets.cancel).toThrow("Ticket ID not provided");

  });
  
  // http://qminderapp.com/docs/api/tickets/#cancelling
  it("should throw exception for missing user id in cancellation call", function() {
    
    var call = function() {
      Qminder.tickets.cancel(1);
    };
    
    expect(call).toThrow("User ID not provided");

  });
  
  // http://qminderapp.com/docs/api/tickets/#cancelling
  it("should throw exception for missing callback function in cancellation call", function() {
    
    var call = function() {
      Qminder.tickets.cancel(1, 2);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://qminderapp.com/docs/api/tickets/#cancelling
  it("should cancel a ticket", function() {
  
    createLine();
    var response = null;
    var ticketId = null;
    
    createTicket(null, function(r) {
      ticketId = r.id;
    });
  
    runs(function() {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.cancel(ticketId, userId, function(r) {
            response = r;
          });
        });
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
    
    
    runs(function() {
      expect(response.result).toBe("success");
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#details
  it("should throw exception for missing ticket id in details call", function() {
    
    expect(Qminder.tickets.details).toThrow("Ticket ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#details
  it("should throw exception for missing callback in details call", function() {
  
    var call = function() {
      Qminder.tickets.details(1);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#details
  it("should find ticket details", function() {
    
    createLine();
    
    var response = null;
    
    createTicket(null, function(r) {
      Qminder.tickets.details(r.id, function(r) {
        response = r;
      });
    });
    
    waitsFor(function() {
      return response !== null;
    }, "API call did not return in time", 10000);
  
    runs(function() {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBe(null);
      expect(response.number).not.toBe(null);
      expect(response.status).not.toBe(null);
      expect(response.line).not.toBe(null);
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
