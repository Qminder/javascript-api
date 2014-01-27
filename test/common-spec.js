describe("Common", function() {

  beforeEach(function() {
    QminderAPI.setSecretKey(QMINDER_SECRET_KEY);
  });
  
  it("should not show BASE_URL", function() {
  
    expect(QminderAPI.BASE_URL).not.toBeDefined();

  });
  
  it("should not show request", function() {
  
    expect(QminderAPI.request).not.toBeDefined();

  });
  
  it("should not show createCORSRequest", function() {
  
    expect(QminderAPI.createCORSRequest).not.toBeDefined();

  });
  
  it("should not show secretKey", function() {
  
    expect(QminderAPI.secretKey).not.toBeDefined();

  });

});
