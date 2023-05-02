import * as sinon from 'sinon';
import { Qminder } from '../../qminder';
import { LocationService } from './location.service';

describe('Location service', function () {
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
      LocationService.list();
      expect(requestStub.calledWith('locations/')).toBeTruthy();
    });

    it('resolves with an Array of Location objects', function (done) {
      LocationService.list().then((locations) => {
        expect(locations instanceof Array).toBeTruthy();
        done();
      });
    });

    it('resolves with correct location data', async () => {
      const groundTruth = LOCATIONS;
      const locations = await LocationService.list();
      for (let i = 0; i < locations.length; i++) {
        expect(locations[i].id).toBe(groundTruth[i].id);
        expect(locations[i].name).toBe(groundTruth[i].name);
        expect(locations[i].latitude).toBeCloseTo(groundTruth[i].latitude, 5);
        expect(locations[i].longitude).toBeCloseTo(groundTruth[i].longitude, 5);
      }
    });
  });

  describe('list() - Fails', function () {
    it('rejects when the server errors', function (done) {
      requestStub.withArgs('locations/').rejects({ statusCode: 500 });
      LocationService.list().then(
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

      LocationService.details(LOCATION_ID).then((details) => {
        locationDetailsReply = details;
        done();
      });
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

      LocationService.getDesks({ id: LOCATION_ID }).then((desks) => {
        desksReply = desks;
        done();
      });
    });
    it('returns the right desks', function () {
      const returned = desksReply.map((desk: Qminder.Desk) => desk.name);
      const groundTruth = DESKS.map((desk) => desk.name);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
  });

  afterEach(function () {
    requestStub.restore();
  });
});
