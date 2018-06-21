describe("LineService", function() {

  const LINES = [
    {"id":71490,"name":"Front Desk","color":"#39cccc","disabled":false},
    {"id":64415,"name":"Scheduling","color":"#01ff70","disabled":false},
    {"id":71613,"name":"Pre-Service","color":"#b10dc9","disabled":false},
    {"id":54837,"name":"Financial Consultation","color":"#0074d9","disabled":false},
    {"id":71615,"name":"Lab Notifications","color":"#aaaaaa","disabled":false},
  ];
  const LOCATION_ID = 673;

  beforeEach(function() {
    if (typeof Qminder === 'undefined') {
      Qminder = this.Qminder;
    }
    if (typeof sinon === 'undefined') {
      sinon = this.sinon;
    }
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');

    // Stub ApiBase.request to feed specific data to API
    this.requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  afterEach(function() {
    Qminder.ApiBase.request.restore();
  });

  describe("list()", function() {
    beforeEach(function(done) {
      this.requestStub.withArgs(`locations/${LOCATION_ID}/lines`).resolves({ data: LINES });
      Qminder.lines.list(LOCATION_ID).then(lines => {
        this.lines = lines;
        done();
      });
    });

    it("returns a list of Qminder.Line objects", function () {
      const allAreInstances = this.lines.reduce(
        (acc, line) => acc && (line instanceof Qminder.Line));
      expect(allAreInstances).toBeTruthy();
    });

    it("returns the right line IDs", function () {
      const lines = this.lines.map(x => x.id);
      const correctLines = LINES.map(x => x.id);

      for (let i = 0; i < correctLines.length; i++) {
        expect(lines[i]).toBe(correctLines[i]);
      }
    });

    it("the name of the line is correct", function () {
      const names = this.lines.map(x => x.name);
      const correctNames = LINES.map(x => x.name);

      for (let i = 0; i < correctNames.length; i++) {
        expect(names[i]).toBe(correctNames[i]);
      }
    });

    it("the color of the line is correct", function () {
      const colors = this.lines.map(x => x.color);
      const correctColors = LINES.map(x => x.color);

      for (let i = 0; i < correctColors.length; i++) {
        expect(colors[i]).toBe(correctColors[i]);
      }
    });
  });


});
