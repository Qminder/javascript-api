describe("Common", function() {

  beforeEach(function() {
    Qminder.setKey(QMINDER_SECRET_KEY);
  });
  
  it("should not show BASE_URL", function() {
  
    expect(Qminder.BASE_URL).not.toBeDefined();

  });
  
  it("should not show request", function() {
  
    expect(Qminder.request).not.toBeDefined();

  });
  
  it("should not show createCORSRequest", function() {
  
    expect(Qminder.createCORSRequest).not.toBeDefined();

  });
  
  it("should not show apiKey", function() {
  
    expect(Qminder.apiKey).not.toBeDefined();

  });

});
