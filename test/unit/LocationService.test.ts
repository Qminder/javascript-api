import * as sinon from 'sinon';
import * as Qminder from '../../src/qminder-api';

describe('Qminder.locations', function () {
  const LOCATIONS = [
    {
      id: 1,
      name: 'Headquarters',
      latitude: 59.4297,
      longitude: 24.8149,
    },
    {
      id: 2,
      name: 'Branch Office',
      latitude: 59.4297,
      longitude: 24.8149,
    },
    {
      id: 3,
      name: 'Small City Branch',
      latitude: 59.4297,
      longitude: 24.8149,
    },
    {
      id: 4,
      name: 'University Popup',
      latitude: 59.4297,
      longitude: 24.8149,
    },
    {
      id: 5,
      name: 'Service Center',
      latitude: 59.4297,
      longitude: 24.8149,
    },
  ];
  const DETAILS = {
    statusCode: 200,
    id: 673,
    name: 'Tartu HQ',
    timezoneOffset: 120,
  };
  const LOCATION_ID = 673;

  const DESKS = [1, 2, 3, 4].map((x) => ({ name: `${x}` }));

  let requestStub: sinon.SinonStub;

  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  describe('list() - OK', function () {
    beforeEach(function () {
      requestStub.withArgs('locations/').resolves({ data: LOCATIONS });
    });

    it('calls ApiBase.request with GET locations/', function () {
      Qminder.locations.list();
      expect(requestStub.calledWith('locations/')).toBeTruthy();
    });

    it('resolves with an Array of Location objects', function (done) {
      Qminder.locations.list().then((locations) => {
        expect(locations instanceof Array).toBeTruthy();
        expect(
          locations.every((location) => location instanceof Qminder.Location),
        ).toBeTruthy();
        done();
      });
    });

    it('resolves with correct location data', function (done) {
      const groundTruth = LOCATIONS;
      Qminder.locations.list().then((locations) => {
        for (let i = 0; i < locations.length; i++) {
          expect(locations[i].id).toBe(groundTruth[i].id);
          expect(locations[i].name).toBe(groundTruth[i].name);
          expect(locations[i].latitude).toBeCloseTo(groundTruth[i].latitude, 5);
          expect(locations[i].longitude).toBeCloseTo(
            groundTruth[i].longitude,
            5,
          );
          done();
        }
      });
    });
  });

  describe('list() - Fails', function () {
    it('rejects when the server errors', function (done) {
      requestStub.withArgs('locations/').rejects({ statusCode: 500 });
      Qminder.locations.list().then(
        (response) => {
          expect(response).toBeUndefined();
          expect(true).toBe(false);
          done();
        },
        (response) => {
          expect(response).toBeDefined();
          expect(response.statusCode).toBe(500);
          done();
        },
      );
    });
  });

  describe('details() - plain location', function () {
    let locationDetailsReply: any;
    beforeEach(function (done) {
      requestStub.withArgs(`locations/${LOCATION_ID}/`).resolves(DETAILS);

      Qminder.locations.details(LOCATION_ID).then((details) => {
        locationDetailsReply = details;
        done();
      });
    });

    it('resolves with a Location instance', function () {
      expect(locationDetailsReply instanceof Qminder.Location).toBeTruthy();
    });

    it('resolves with correct ID', function () {
      expect(locationDetailsReply.id).toBe(673);
    });

    it('includes location name', function () {
      expect(locationDetailsReply.name).toBe('Tartu HQ');
    });

    it('includes location timezone offset', function () {
      expect(locationDetailsReply.timezoneOffset).toBe(120);
    });
  });

  describe('getDesks()', function () {
    let desksReply: any[];
    beforeEach(function (done) {
      requestStub
        .withArgs(`locations/${LOCATION_ID}/desks`)
        .resolves({ desks: DESKS });

      Qminder.locations
        .getDesks(new Qminder.Location(LOCATION_ID))
        .then((desks) => {
          desksReply = desks;
          done();
        });
    });
    it('returns a list of Qminder.Desk objects', function () {
      const allAreInstances = desksReply.every(
        (desk: unknown) => desk instanceof Qminder.Desk,
      );
      expect(allAreInstances).toBeTruthy();
    });
    it('returns the right desks', function () {
      const returned = desksReply.map((desk: Qminder.Desk) => desk.name);
      const groundTruth = DESKS.map((desk) => desk.name);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
  });

  describe('getInputFields()', function () {
    const fields = [{ type: 'firstName' }, { type: 'lastName' }];
    beforeEach(function () {
      requestStub
        .withArgs(`locations/${LOCATION_ID}/input-fields`)
        .resolves({ fields });
    });
    it('throws with undefined location ID', function () {
      expect(() => (Qminder.locations.getInputFields as any)()).toThrow();
    });
    it("throws with an object that doesn't fit", function () {
      expect(() =>
        (Qminder.locations.getInputFields as any)({ statusCode: 200 }),
      ).toThrow();
    });
    it('does not throw with numeric location ID', function () {
      expect(() => Qminder.locations.getInputFields(LOCATION_ID)).not.toThrow();
    });
    it('does not throw with Qminder.Location', function () {
      expect(() =>
        Qminder.locations.getInputFields(new Qminder.Location(LOCATION_ID)),
      ).not.toThrow();
    });
    it('calls the right URL with numeric location ID', function (done) {
      Qminder.locations.getInputFields(LOCATION_ID).then(
        () => {
          expect(
            requestStub.calledWith(`locations/${LOCATION_ID}/input-fields`),
          ).toBeTruthy();
          done();
        },
        (err) => {
          expect(err).toBeUndefined();
          done();
        },
      );
    });
    it('gets the input fields from the response object', function (done) {
      Qminder.locations.getInputFields(LOCATION_ID).then(
        (response) => {
          expect(response).toEqual(fields);
          done();
        },
        (err) => {
          expect(err).toBeUndefined();
          done();
        },
      );
    });
  });

  afterEach(function () {
    requestStub.restore();
  });
});
