describe("Users", function() {

  "use strict";
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for missing parameters in create user call", function() {

    expect(Qminder.users.create).toThrow("Parameters not provided");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for invalid parameter type in create user call", function() {
  
    var call = function() {
      Qminder.users.create("Mari");
    };

    expect(call).toThrow("Parameter has to be an object");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for missing callback in create user call", function() {
  
    var call = function() {
      Qminder.users.create({}, null);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for invalid parameter in create user call", function() {
  
    var call = function() {
      Qminder.users.create({"name": "Stewart"}, function() {});
    };

    expect(call).toThrow("Parameter \"name\" is unknown and should not be used. Valid parameters: [\"email\",\"firstName\",\"lastName\",\"roles\"]");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for missing email parameter in create user call", function() {
  
    var call = function() {
      Qminder.users.create({}, function() {});
    };

    expect(call).toThrow("Parameter \"email\" is mandatory.");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for missing first name parameter in create user call", function() {
  
    var call = function() {
      Qminder.users.create({"email": "user@example.com"}, function() {});
    };

    expect(call).toThrow("Parameter \"firstName\" is mandatory.");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for missing last name parameter in create user call", function() {
  
    var call = function() {
      Qminder.users.create({"email": "user@example.com", "firstName": "Stewart"}, function() {});
    };

    expect(call).toThrow("Parameter \"lastName\" is mandatory.");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for missing roles parameter in create user call", function() {
  
    var call = function() {
      Qminder.users.create({"email": "user@example.com", "firstName": "Stewart", "lastName": "Little"}, function() {});
    };

    expect(call).toThrow("Parameter \"roles\" is mandatory.");

  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should create a users", function(done) {
  
    var create = function(location) {
      var parameters = {
        "email": "user@example.com",
        "firstName": "Stewart",
        "lastName": "Little",
        "roles": [
          {
            "type": "CLERK",
            "location": location.id
          }
        ]};
      Qminder.users.create(parameters, function(response) {
        expect(response.statusCode).toBe(200);
        expect(response.id).not.toBe(null);
        done();
      });
    };
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      create(location);
    });
  });

});