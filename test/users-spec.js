describe("Users", function() {

  "use strict";
  
  var user = null;
  
  afterEach(function(done) {
  
    if (user === null) {
      done();
      return;
    }
    
    Qminder.users.delete(user, function() {
      done();
    });
    
  });
  
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
        user = response.id;
        done();
      });
    };
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      create(location);
    });
  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for missing user ID in adding role call", function() {

    expect(Qminder.users.addRole).toThrow("User ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for missing parameters in adding role call", function() {
    
    var call = function() {
      Qminder.users.addRole(1);
    };

    expect(call).toThrow("Parameters not provided");
  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for invalid parameter type in adding role call", function() {
  
    var call = function() {
      Qminder.users.addRole(1, "Juku");
    };

    expect(call).toThrow("Parameter has to be an object");

  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for invalid parameter in adding role call", function() {
  
    var call = function() {
      Qminder.users.addRole(1, {"name": "Mike"});
    };

    expect(call).toThrow("Parameter \"name\" is unknown and should not be used. Valid parameters: [\"type\",\"location\"]");

  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for missing type parameter in add role call", function() {
  
    var call = function() {
      Qminder.users.addRole(1, {});
    };

    expect(call).toThrow("Parameter \"type\" is mandatory.");

  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for missing location parameter in add role call", function() {
  
    var call = function() {
      Qminder.users.addRole(1, {"type": "MANAGER"});
    };

    expect(call).toThrow("Parameter \"location\" is mandatory.");

  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for invalid type in add role call", function(done) {
  
    var createRole = function() {
      var parameters = {
        "type": "USER",
        "location": 1
        };
      Qminder.users.addRole(user, parameters, function(response) {
        expect(response.statusCode).toBe(400);
        expect(response.attribute).toBe("type");
        expect(response.message).toBe("Parameter \"type\" is invalid");
        expect(response.developerMessage).toBe("Valid values are \"CLERK\", \"MANAGER\"");
        done();
      });
    };
    
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
        user = response.id;
        createRole();
      });
    };
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      create(location);
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should throw exception for invalid location in add role call", function(done) {
  
    var createRole = function() {
      var parameters = {
        "type": "MANAGER",
        "location": 1
        };
      Qminder.users.addRole(user, parameters, function(response) {
        expect(response.statusCode).toBe(400);
        expect(response.message).toBe("Location does not exist");
        done();
      });
    };
    
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
        user = response.id;
        createRole();
      });
    };
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      create(location);
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/users/#adding-role
  it("should add a role", function(done) {
  
    var createRole = function(location) {
      var parameters = {
        "type": "MANAGER",
        "location": location.id
        };
      Qminder.users.addRole(user, parameters, function(response) {
        expect(response.statusCode).toBe(200);
        done();
      });
    };
    
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
        user = response.id;
        createRole(location);
      });
    };
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      create(location);
    });
    
  });
  
  // http://www.qminderapp.com/docs/api/users/#creating
  it("should throw exception for missing user in add role call", function(done) {
  
    var parameters = {
      "type": "MANAGER",
      "location": 1
      };
    Qminder.users.addRole(1, parameters, function(response) {
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe("User with id 1 not found");
      done();
    });
  });
  
  // http://www.qminderapp.com/docs/api/users/#resetting
  it("should throw exception for missing id in delete call", function() {
    
    expect(Qminder.users.delete).toThrow("User ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/users/#deleting
  it("should delete a user", function(done) {
  
    var deleteUser = function() {
      Qminder.users.delete(user, function(response) {
        expect(response.statusCode).toBe(200);
        user = null;
        done();
      });
    };
  
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
        user = response.id;
        deleteUser();
      });
    };
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      create(location);
    });
  });

  // http://www.qminderapp.com/docs/api/users/#details
  it("should throw exception for missing id in details call", function() {
    
    expect(Qminder.users.details).toThrow("User ID not provided");

  });
  
  // http://www.qminderapp.com/docs/api/users/#details
  it("should throw exception for missing callback in details call", function() {
  
    var call = function() {
      Qminder.users.details(1, null);
    };
    
    expect(call).toThrow("Callback function not provided");

  });
  
  // http://www.qminderapp.com/docs/api/users/#details
  it("should get user details", function(done) {
  
    var getDetails = function() {
      Qminder.users.details(user, function(response) {
        expect(response.statusCode).toBe(200);
        expect(response.id).not.toBe(null);
        expect(response.email).not.toBe(null);
        expect(response.firstName).not.toBe(null);
        expect(response.lastName).not.toBe(null);
        done();
      });
    };
  
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
        user = response.id;
        getDetails();
      });
    };
  
    Qminder.locations.list(function(r) {
      var location = r.data[0];
      create(location);
    });
  });


});