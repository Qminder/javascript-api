jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

describe("Tickets", function() {

  "use strict";

  var line = null;

  beforeEach(function(done) {
    Qminder.setKey(QMINDER_SECRET_KEY);
    line = null;
    
    Qminder.locations.list(function(r) {
      var location = r.data[0];
          
      Qminder.locations.createLine(location.id, "Temp Line", function(response) {
        line = response.id;
        done();
      });
    });
    
  });
  
  afterEach(function(done) {
  
    if (!line) {
      done();
      return;
    }

    Qminder.lines.delete(line, function() {
      done();
    });
  });
  
  // http://qminderapp.com/docs/api/tickets/#auditlogs
  it("should throw exception for missing ticket id in auditLogs call", function() {
    
    expect(Qminder.tickets.auditLogs).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#auditlogs
  it("should throw exception for missing callback function in auditLogs call", function() {
    
    var call = function() {
      Qminder.tickets.recall(1);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#auditlogs
  it("should find audit logs for ticket", function(done) {
    
    var addLabel = function(ticketId, callback) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.addLabel(ticketId, "Important & Awsome", userId, function(response) {
            expect(response.result).toBe("success");
            callback();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      addLabel(r.id, function () {
        Qminder.tickets.auditLogs(r.id, function(response) {
          expect(response.statusCode).toBe(200);
          expect(response.id).not.toBe(null);
          console.log(response.data);
          expect(response.data.changes.value).toBe("Important & Awsome");
          done();
        });
      });
    });
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
    
    expect(call).toThrow("Parameter \"name\" is unknown and should not be used. Valid parameters: [\"source\",\"phoneNumber\",\"firstName\",\"lastName\",\"extra\"]");

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
  it("should throw exception for invalid source create ticket call", function() {
  
    var call = function() {
      Qminder.tickets.create(123, {"source": "WINDOWSPHONE"}, function() {});
    };
    
    expect(call).toThrow("Source is invalid. Valid values: [\"IPHONE\",\"ANDROID\",\"MANUAL\",\"NAME\",\"PRINTER\"]");

  });

  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket", function(done) {
    Qminder.tickets.create(line, null, function(response) {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBe(null);
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with source", function(done) {
    var source = "NAME";
    createTicket({"source": source}, function(response) {
      expect(response.source).toBe(source);
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with phone number", function(done) {
    var number = 123456;
    createTicket({"phoneNumber": number}, function(response) {
      expect(response.phoneNumber).toBe(number);
      done();
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with first name", function(done) {
    var name = "Good Guy Greg";
    createTicket({"firstName": name}, function(response) {
      expect(response.firstName).toBe(name);
      done();
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with both names", function(done) {
    createTicket({"firstName": "Milli", "lastName": "Mallikas"}, function(response) {
      expect(response.firstName).toBe("Milli");
      expect(response.lastName).toBe("Mallikas");
      done();
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with last name", function(done) {
    var name = "Scumbag Steve";
    createTicket({"lastName": name}, function(response) {
      expect(response.lastName).toBe(name);
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#creating
  it("should create a ticket with extra parameters", function(done) {
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
      if (idCode.title != "ID Code") {
        idCode = response.extra[1];
      }
      expect(idCode.title).toBe("ID Code");
      expect(idCode.value).toBe("1234567890");
      expect(idCode.value.url).not.toBeDefined();
      
      var website = response.extra[1];
      if (website.title != "Website") {
        website = response.extra[0];
      }
      expect(website.title).toBe("Website");
      expect(website.value).toBe("CNN website");
      expect(website.url).toBe("http://edition.cnn.com");
      done();
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
  it("should search tickets with no filters", function(done) {

    searchTickets(null, function(response) {
      expect(response.data.length).toBeGreaterThan(0);
      done();
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets with no filters and with error callback", function(done) {
    
    searchTickets(null, function(response) {
      expect(response.data.length).toBeGreaterThan(0);
      done();
    },
    function() {
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets from location", function(done) {
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      searchTickets({"location": location.id}, function(response) {
        expect(response.data.length).toBeGreaterThan(0);
        done();
      });
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets from line", function(done) {
    searchTickets({"line": line}, function(response) {
      expect(response.data.length).toBeGreaterThan(0);
      done();
    });
  });
  
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search new tickets", function(done) {
    searchTickets({"status": "NEW"}, function(response) {
      expect(response.data.length).toBeGreaterThan(0);
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search called tickets", function(done) {
    searchTickets({"line": line, "status": "CALLED"}, function(response) {
      expect(response.data.length).toBe(0);
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets with limit", function(done) {
    searchTickets({"limit": 2}, function(response) {
      expect(response.data.length).toBeLessThan(3);
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#search
  it("should search tickets ordered by id desc", function(done) {
  
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
      
      done();
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
  it("should call a ticket - no tickets to call", function(done) {
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
        
      Qminder.locations.users(location.id, function(response) {
        var userId = response.data[0].id;
        Qminder.tickets.callNext({"lines":line, "user":userId}, function(response) {
          expect(response.statusCode).toBe(200);
          expect(response.id).not.toBeDefined();
          done();
        });
      });
    });
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should call next ticket", function(done) {
    
    var search = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.callNext({"lines":line, "user":userId}, function(response) {
            expect(response.statusCode).toBe(200);
            expect(response.id).toBeDefined();
            expect(response.id).toBe(ticketId);
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      search(r.id);
    });

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#calling-from-list
  it("should call a ticket from list of lines", function(done) {
    
    var search = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.callNext({"lines":[line], "user":userId}, function(response) {
            expect(response.statusCode).toBe(200);
            expect(response.id).toBeDefined();
            expect(response.id).toBe(ticketId);
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      search(r.id);
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
  it("should call ticket", function(done) {
    
    var call = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.call({"id":ticketId, "user":userId}, function(response) {
            expect(response.statusCode).toBe(200);
            expect(response.id).toBeDefined();
            expect(response.id).toBe(ticketId);
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      call(r.id);
    });
  });
  
  // http://qminderapp.com/docs/api/tickets/#recalling
  it("should throw exception for missing ticket id in recalling call", function() {
    
    expect(Qminder.tickets.recall).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#recalling
  it("should throw exception for missing callback function in recalling call", function() {
    
    var call = function() {
      Qminder.tickets.recall(1);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#recalling
  it("should recall ticket", function(done) {
  
    var call = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.call({"id":ticketId, "user":userId}, function(r) {
            Qminder.tickets.recall(r.id, function(response) {
              expect(response.statusCode).toBe(200);
              expect(response.result).toBe("success");
              done();
            });
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      call(r.id);
    });

  });
  
  
  // http://qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for missing ticket id in editing call", function() {
    
    expect(Qminder.tickets.edit).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for missing parameters in editing call", function() {
    
    var call = function() {
      Qminder.tickets.edit(1);
    };
    
    expect(call).toThrow("Parameters not provided");
  });
    
  // http://qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for missing callback function in editing call", function() {
    
    var call = function() {
      Qminder.tickets.edit(1, {}, 2);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for invalid parameter in editing call", function() {
  
    var call = function() {
      Qminder.tickets.edit(123, {"name": "Tuuli"}, 2, function() {});
    };
    
    expect(call).toThrow("Parameter \"name\" is unknown and should not be used. Valid parameters: [\"line\",\"user\",\"phoneNumber\",\"firstName\",\"lastName\",\"extra\"]");
  });
  
  
  // http://www.qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for invalid parameter type in editing call", function() {
  
    var call = function() {
      Qminder.tickets.edit(123, "Tuuli", 3, function() {});
    };
    
    expect(call).toThrow("Parameter has to be an object");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for invalid extra parameter type in editing call", function() {
  
    var call = function() {
      Qminder.tickets.edit(123, {"extra": "Madli"}, 3, function() {});
    };
    
    expect(call).toThrow("Extra parameter has to be an array");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for invalid extra parameter in editing call", function() {
  
    var call = function() {
      Qminder.tickets.edit(123, {"extra": ["Peeter"]}, 3, function() {});
    };
    
    expect(call).toThrow("All extra parameters have to be objects");

  });
  
  // http://www.qminderapp.com/docs/api/tickets/#editing
  it("should throw exception for invalid extra parameter field in editing call", function() {
  
    var call = function() {
      Qminder.tickets.edit(123, {"extra": [{"name": "Meeli"}]}, 3, function() {});
    };
    
    expect(call).toThrow("Extra parameter field \"name\" is unknown and should not be used. Valid fields: [\"title\",\"value\",\"url\"]");

  });
  
  // http://qminderapp.com/docs/api/tickets/#editing
  it("should edit a ticket", function(done) {
    
    var edit = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.edit(ticketId, {"firstName": "Madli"}, userId, function(response) {
            expect(response.result).toBe("success");
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      edit(r.id);
    });
  });
  
  // http://qminderapp.com/docs/api/tickets/#editing
  it("should edit line of a ticket", function(done) {
    
    var edit = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.createLine(location.id, "New Line", function(r) {
          var line = r.id;
          Qminder.tickets.edit(ticketId, {"line": line.id}, null, function(response) {
            expect(response.result).toBe("success");
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      edit(r.id);
    });
  });
  
  // http://qminderapp.com/docs/api/tickets/#editing
  it("should edit a tickets extra fields", function(done) {
    
    var edit = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          var parameters = {"firstName": "Madli", "extra": [{"title": "Email", "value": "user@example.com"}, {"title": "Address", "value": "Tartu, Estonia"}]};
          Qminder.tickets.edit(ticketId, parameters, userId, function(response) {
            expect(response.result).toBe("success");
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      edit(r.id);
    });
  });
  
  
  // http://qminderapp.com/docs/api/tickets/#marking-served
  it("should throw exception for missing ticket id in marking served call", function() {
    
    expect(Qminder.tickets.markServed).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#marking-served
  it("should throw exception for missing callback function in marking served call", function() {
    
    var call = function() {
      Qminder.tickets.markServed(1);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#marking-served
  it("should mark ticket as served", function(done) {
  
    var markServed = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.call({"id":ticketId, "user":userId}, function(r) {
            Qminder.tickets.markServed(r.id, function(response) {
              expect(response.statusCode).toBe(200);
              expect(response.result).toBe("success");
              done();
            });
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      markServed(r.id);
    });

  });
  
  // http://qminderapp.com/docs/api/tickets/#marking-noshow
  it("should throw exception for missing ticket id in marking no show call", function() {
    
    expect(Qminder.tickets.markNoShow).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#marking-noshow
  it("should throw exception for missing callback function in marking no show call", function() {
    
    var call = function() {
      Qminder.tickets.markNoShow(1);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://www.qminderapp.com/docs/api/tickets/#marking-noshow
  it("should mark ticket as no show", function(done) {
  
    var markServed = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.call({"id":ticketId, "user":userId}, function(r) {
            Qminder.tickets.markNoShow(r.id, function(response) {
              expect(response.statusCode).toBe(200);
              expect(response.result).toBe("success");
              done();
            });
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      markServed(r.id);
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
  it("should cancel a ticket", function(done) {
  
    var cancel = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.cancel(ticketId, userId, function(response) {
            expect(response.result).toBe("success");
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      cancel(r.id);
    });
  });
  
  // https://qminderapp.com/docs/api/tickets/#assigning
  it("should throw exception for missing ticket id in assign call", function() {
    
    expect(Qminder.tickets.assign).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#assigning
  it("should throw exception for missing assigner in assign call", function() {
    
    var call = function() {
      Qminder.tickets.assign(1);
    };
    
    expect(call).toThrow("User ID of assigner not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#assigning
  it("should throw exception for missing assignee in assign call", function() {
    
    var call = function() {
      Qminder.tickets.assign(1, 2);
    };
    
    expect(call).toThrow("User ID of assignee not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#assigning
  it("should throw exception for missing callback function in assign call", function() {
    
    var call = function() {
      Qminder.tickets.assign(1, 2, 3);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#assigning
  it("should assign a ticket", function(done) {
  
    var assign = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var assignerId = usersResponse.data[0].id;
          var assigneeId = usersResponse.data[1].id;
          
          Qminder.tickets.assign(ticketId, assignerId, assigneeId, function(response) {
            expect(response.result).toBe("success");
            Qminder.tickets.details(ticketId, function(response) {
              expect(response.assigned.assigner).toBe(assignerId);
              expect(response.assigned.assignee).toBe(assigneeId);
              done();
            });
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      assign(r.id);
    });
  });
  
  // https://qminderapp.com/docs/api/tickets/#reordering
  it("should throw exception for missing ticket id in reorder call", function() {
    
    expect(Qminder.tickets.reorder).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#reordering
  it("should throw exception for missing callback function in reorder call", function() {
    
    var call = function() {
      Qminder.tickets.reorder(1);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#reordering
  it("should reorder a ticket to the first", function(done) {
  
    var reorder = function(ticketId) {
      Qminder.tickets.reorder(ticketId, null, function(response) {
        expect(response.result).toBe("success");
        Qminder.tickets.details(ticketId, function(response) {
          expect(response.orderAfter).not.toBe(null);
          done();
        });
      });
    };
    
    createTicket(null, function(r) {
      reorder(r.id);
    });
  });
  
  // http://qminderapp.com/docs/api/tickets/#reordering
  it("should reorder a ticket to be the second in the list", function(done) {
  
    var reorder = function(ticketId, after) {
      Qminder.tickets.reorder(ticketId, after, function(response) {
        expect(response.result).toBe("success");
        Qminder.tickets.details(ticketId, function(response) {
          expect(response.orderAfter).not.toBe(null);
          done();
        });
      });
    };
    
    createTicket(null, function(ticket1) {
      createTicket(null, function(ticket2) {
        reorder(ticket1.id, ticket2.id);
      });
    });
  });
  
  // http://qminderapp.com/docs/api/tickets/#labelling
  it("should throw exception for missing ticket id in labelling call", function() {
    
    expect(Qminder.tickets.addLabel).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#labelling
  it("should throw exception for missing value in labelling call", function() {
    
    var call = function() {
      Qminder.tickets.addLabel(1);
    };
    
    expect(call).toThrow("Value not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#labelling
  it("should throw exception for missing user id in labelling call", function() {
    
    var call = function() {
      Qminder.tickets.addLabel(1, "VIP");
    };
    
    expect(call).toThrow("User ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#labelling
  it("should throw exception for missing callback function in labelling call", function() {
    
    var call = function() {
      Qminder.tickets.addLabel(1, "Important", 2);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#labelling
  it("should add a label to a ticket", function(done) {
  
    var addLabel = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.addLabel(ticketId, "Important & Awsome", userId, function(response) {
            expect(response.result).toBe("success");
            done();
          });
        });
      });
    };

    createTicket(null, function(r) {
      addLabel(r.id);
    });

  });
  
  // http://qminderapp.com/docs/api/tickets/#labelling
  it("should not add label twice", function(done) {

    var addLabel = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.addLabel(ticketId, "VIP", userId, function() {
            Qminder.tickets.addLabel(ticketId, "VIP", userId, function(response) {
              expect(response.result).toBe("no action");
              done();
            });
          });
        });
      });
    };

    createTicket(null, function(r) {
      addLabel(r.id);
    });
  });
  
  
  // http://qminderapp.com/docs/api/tickets/#removing-label
  it("should throw exception for missing ticket id in removing label call", function() {
    
    expect(Qminder.tickets.removeLabel).toThrow("Ticket ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#removing-label
  it("should throw exception for missing value in removing label call", function() {
    
    var call = function() {
      Qminder.tickets.removeLabel(1);
    };
    
    expect(call).toThrow("Value not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#removing-label
  it("should throw exception for missing user id in removing label call", function() {
    
    var call = function() {
      Qminder.tickets.removeLabel(1, "VIP");
    };
    
    expect(call).toThrow("User ID not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#removing-label
  it("should throw exception for missing callback function in removing label call", function() {
    
    var call = function() {
      Qminder.tickets.removeLabel(1, "Important", 2);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  // http://qminderapp.com/docs/api/tickets/#removing-label
  it("should remove a non-existing label from a ticket", function(done) {
  
    var removeLabel = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.removeLabel(ticketId, "Important & Awsome", userId, function(response) {
            expect(response.result).toBe("success");
            done();
          });
        });
      });
    };
    
    createTicket(null, function(r) {
      removeLabel(r.id);
    });
  });
  
  // http://qminderapp.com/docs/api/tickets/#removing-label
  it("should remove a label from a ticket", function(done) {
  
    var removeLabel = function(ticketId) {
      Qminder.locations.list(function(r) {
        var location = r.data[0];
        
        Qminder.locations.users(location.id, function(r) {
          var usersResponse = r;
          var userId = usersResponse.data[0].id;
          
          Qminder.tickets.addLabel(ticketId, "VIP", userId, function() {
            Qminder.tickets.removeLabel(ticketId, "VIP", userId, function(response) {
              expect(response.result).toBe("success");
              done();
            });
          });
        });
      });
    };

    createTicket(null, function(r) {
      removeLabel(r.id);
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
  it("should find ticket details", function(done) {
    
    createTicket(null, function(r) {
      Qminder.tickets.details(r.id, function(response) {
        expect(response.statusCode).toBe(200);
        expect(response.id).not.toBe(null);
        expect(response.number).not.toBe(null);
        expect(response.status).not.toBe(null);
        expect(response.line).not.toBe(null);
        done();
      });
    });
  });
  
  var createTicket = function(parameters, callback) {
  
    Qminder.tickets.create(line, parameters, function(response) {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBe(null);
        
      Qminder.tickets.details(response.id, function(detailsResponse) {
        expect(detailsResponse.statusCode).toBe(200);
        expect(detailsResponse.id).toBe(response.id);
        expect(detailsResponse.status).toBe("NEW");
        expect(detailsResponse.created.date).not.toBe(null);
        callback(detailsResponse);
      });
    });
  };
  
  var searchTickets = function(parameters, callback) {
    createTicket(null, function() {
      Qminder.tickets.search(parameters, function(response) {
        expect(response.statusCode).toBe(200);
        callback(response);
      });
    });
  };
    
});
