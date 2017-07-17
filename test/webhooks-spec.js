describe("Webhooks", function() {

  "use strict";

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
  });

  it("should throw exception for missing parameters in webhook adding call", function() {
    
    expect(Qminder.webhooks.add).toThrow("Parameters not provided");
  });
  
  it("should throw exception for incorrect parameters object in webhook adding call", function() {
  
    var call = function() {
      Qminder.webhooks.add("Juku");
    };
    
    expect(call).toThrow("Parameter has to be an object");
  });
  
  it("should throw exception for missing callback in webhook adding call", function() {
  
    var call = function() {
      Qminder.webhooks.add({});
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  it("should throw exception for missing url in webhook adding call", function() {
  
    var call = function() {
      Qminder.webhooks.add({}, function(){});
    };
    
    expect(call).toThrow("Parameter \"url\" is mandatory.");
  });
  
  it("should throw exception for missing id in webhook removal call", function() {
    
    expect(Qminder.webhooks.delete).toThrow("Webhook id not provided");
  });
  
  it("should throw exception for missing callback in webhook removal call", function() {
  
    var call = function() {
      Qminder.webhooks.delete(1);
    };
    
    expect(call).toThrow("Callback function not provided");
  });
  
  it("should create a webhook and remove it", function(done) {
    
    Qminder.webhooks.add({url: "https://requestb.in/16l82u01"}, function(response) {
      expect(response.statusCode).toBe(200);
      expect(response.id).not.toBe(null);
      expect(response.secret).not.toBe(null);
      
      Qminder.webhooks.delete(response.id, function(deleteResponse) {
        expect(deleteResponse.statusCode).toBe(200);
        done();
      });
    });
  });
});