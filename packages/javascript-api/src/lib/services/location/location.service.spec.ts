import * as sinon from 'sinon';
import { Desk } from '../../model/desk';
import { ResponseValidationError } from '../../model/errors/response-validation-error';
import { InputFieldCreationRequest } from '../../model/input-field/input-field-creation-request';
import { FirstNameFieldCreationRequest } from '../../model/input-field/first-name-field-creation-request';
import { NumericFieldCreationRequest } from '../../model/input-field/numeric-field-creation-request';
import { SelectFieldCreationRequest } from '../../model/input-field/select-field-creation-request';
import { LocationCreationRequest } from '../../model/location/location-creation-request';
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
      requestStub.withArgs('v1/locations/').resolves({ data: LOCATIONS });
    });

    it('calls ApiBase.request with GET locations/', function () {
      LocationService.list();
      expect(requestStub.calledWith('v1/locations/')).toBeTruthy();
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
      requestStub.withArgs('v1/locations/').rejects({ statusCode: 500 });
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
      requestStub.withArgs(`v1/locations/${LOCATION_ID}/`).resolves(DETAILS);

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
        .withArgs(`v1/locations/${LOCATION_ID}/desks`)
        .resolves({ desks: DESKS });

      LocationService.getDesks({ id: LOCATION_ID }).then((desks) => {
        desksReply = desks;
        done();
      });
    });
    it('returns the right desks', function () {
      const returned = desksReply.map((desk: Desk) => desk.name);
      const groundTruth = DESKS.map((desk) => desk.name);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
  });

  describe('setOpeningHours()', function () {
    const OPENING_HOURS = {
      mon: {
        businessHours: [
          {
            opens: { hours: 9, minutes: 0 },
            closes: { hours: 17, minutes: 30 },
          },
        ],
      },
      tue: {
        businessHours: [
          {
            opens: { hours: 9, minutes: 0 },
            closes: { hours: 17, minutes: 30 },
          },
        ],
      },
      wed: {},
      thu: {},
      fri: {},
      sat: { closed: true as const },
      sun: { closed: true as const },
    };

    beforeEach(function () {
      requestStub
        .withArgs(`locations/${LOCATION_ID}/opening-hours`)
        .resolves({});
    });

    it('calls ApiBase.request with correct URL, method, body and headers', async function () {
      await LocationService.setOpeningHours(LOCATION_ID, OPENING_HOURS);
      expect(
        requestStub.calledWith(`locations/${LOCATION_ID}/opening-hours`, {
          method: 'PUT',
          body: JSON.stringify(OPENING_HOURS),
          headers: { 'X-Qminder-API-Version': '2020-09-01' },
        }),
      ).toBeTruthy();
    });
  });

  describe('setOpeningHoursExceptions()', function () {
    const EXCEPTIONS = [
      { date: '2020-05-13', closed: true as const, closedReason: 'Birthday' },
      {
        date: '2020-12-25',
        businessHours: [
          {
            opens: { hours: 10, minutes: 0 },
            closes: { hours: 14, minutes: 0 },
          },
        ],
      },
    ];

    beforeEach(function () {
      requestStub
        .withArgs(`locations/${LOCATION_ID}/opening-hours/exceptions`)
        .resolves({});
    });

    it('calls ApiBase.request with correct URL, method, body and headers', async function () {
      await LocationService.setOpeningHoursExceptions(LOCATION_ID, EXCEPTIONS);
      expect(
        requestStub.calledWith(
          `locations/${LOCATION_ID}/opening-hours/exceptions`,
          {
            method: 'PUT',
            body: JSON.stringify(EXCEPTIONS),
            headers: { 'X-Qminder-API-Version': '2020-09-01' },
          },
        ),
      ).toBeTruthy();
    });
  });

  describe('create()', function () {
    const SUCCESSFUL_RESPONSE = { id: '12345' };
    const VALID_REQUEST: LocationCreationRequest = {
      name: 'Main Office',
      latitude: 59.4297,
      longitude: 24.8149,
      address: '123 Main St',
      country: 'EE',
    };

    it('sends the request to the correct URL with JSON body and version headers', async function () {
      requestStub.resolves(SUCCESSFUL_RESPONSE);
      const result = await LocationService.create(VALID_REQUEST);
      expect(requestStub.firstCall.args).toEqual([
        'locations',
        {
          method: 'POST',
          body: JSON.stringify(VALID_REQUEST),
          headers: { 'X-Qminder-API-Version': '2020-09-01' },
        },
      ]);
      expect(result).toEqual(SUCCESSFUL_RESPONSE);
    });

    it('sends optional fields when provided', async function () {
      requestStub.resolves(SUCCESSFUL_RESPONSE);
      const request: LocationCreationRequest = {
        ...VALID_REQUEST,
        openingHours: {
          regular: {
            mon: {
              businessHours: [
                {
                  opens: { hours: 9, minutes: 0 },
                  closes: { hours: 17, minutes: 0 },
                },
              ],
            },
            tue: {},
            wed: {},
            thu: {},
            fri: {},
            sat: { closed: true as const },
            sun: { closed: true as const },
          },
        },
        inputFields: [],
        languages: ['en', 'et'],
      };
      await LocationService.create(request);
      expect(requestStub.firstCall.args).toEqual([
        'locations',
        {
          method: 'POST',
          body: JSON.stringify(request),
          headers: { 'X-Qminder-API-Version': '2020-09-01' },
        },
      ]);
    });

    it('throws ResponseValidationError when response does not contain id', async function () {
      requestStub.resolves({});
      await expect(LocationService.create(VALID_REQUEST)).rejects.toThrow(
        new ResponseValidationError('Response does not contain "id"'),
      );
    });

    it('throws when request is missing', async function () {
      await expect(LocationService.create(null as any)).rejects.toThrow(
        'Location creation request invalid or missing.',
      );
    });

    it('throws when name is missing', async function () {
      await expect(
        LocationService.create({ ...VALID_REQUEST, name: '' }),
      ).rejects.toThrow('Cannot create a location without a name.');
    });

    it('throws when latitude is missing', async function () {
      await expect(
        LocationService.create({
          ...VALID_REQUEST,
          latitude: undefined as any,
        }),
      ).rejects.toThrow('Cannot create a location without a valid latitude.');
    });

    it('throws when latitude is NaN', async function () {
      await expect(
        LocationService.create({ ...VALID_REQUEST, latitude: NaN }),
      ).rejects.toThrow('Cannot create a location without a valid latitude.');
    });

    it('throws when longitude is missing', async function () {
      await expect(
        LocationService.create({
          ...VALID_REQUEST,
          longitude: undefined as any,
        }),
      ).rejects.toThrow('Cannot create a location without a valid longitude.');
    });

    it('throws when longitude is NaN', async function () {
      await expect(
        LocationService.create({ ...VALID_REQUEST, longitude: NaN }),
      ).rejects.toThrow('Cannot create a location without a valid longitude.');
    });

    it('throws when address is missing', async function () {
      await expect(
        LocationService.create({ ...VALID_REQUEST, address: '' }),
      ).rejects.toThrow('Cannot create a location without an address.');
    });

    it('throws when country is missing', async function () {
      await expect(
        LocationService.create({ ...VALID_REQUEST, country: '' }),
      ).rejects.toThrow('Cannot create a location without a country.');
    });

    it('accepts latitude 0 and longitude 0 as valid coordinates', async function () {
      requestStub.resolves(SUCCESSFUL_RESPONSE);
      const request: LocationCreationRequest = {
        ...VALID_REQUEST,
        latitude: 0,
        longitude: 0,
      };
      const result = await LocationService.create(request);
      expect(result).toEqual(SUCCESSFUL_RESPONSE);
    });
  });

  describe('createInputField()', function () {
    beforeEach(function () {
      requestStub.withArgs('input-fields').resolves({});
    });

    it('sends a TEXT field with correct URL, method, body and headers', async function () {
      const textField: InputFieldCreationRequest = {
        type: 'TEXT',
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        location: { id: LOCATION_ID },
        title: 'Email address',
        visitorFacingTitle: 'Your email',
        isMandatoryBeforeAdded: false,
        isMandatoryBeforeServed: false,
        isMandatoryInRemoteSignIn: false,
        isVisibleInWaitingDrawer: true,
        isVisibleInServingDrawer: true,
        visibleForLines: [{ id: 1 }, { id: 2 }],
        showInRemoteSignIn: false,
        translations: [
          {
            languageCode: 'et',
            title: 'E-posti aadress',
            visitorFacingTitle: 'Sinu e-post',
          },
        ],
      };

      await LocationService.createInputField(textField);
      expect(
        requestStub.calledWith('input-fields', {
          method: 'POST',
          body: JSON.stringify(textField),
          headers: { 'X-Qminder-API-Version': '2020-09-01' },
        }),
      ).toBeTruthy();
    });

    it('sends a SELECT field with options', async function () {
      const selectField: SelectFieldCreationRequest = {
        type: 'SELECT',
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        location: { id: LOCATION_ID },
        title: 'Service type',
        multiSelect: false,
        options: [
          {
            id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
            title: 'Documents',
            color: '#FF0000',
            translations: [{ languageCode: 'et', title: 'Dokumendid' }],
          },
          {
            id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
            title: 'Consultation',
          },
        ],
        isMandatoryBeforeAdded: true,
        isMandatoryBeforeServed: false,
        isMandatoryInRemoteSignIn: false,
        isVisibleInWaitingDrawer: true,
        isVisibleInServingDrawer: true,
        visibleForLines: [],
        showInRemoteSignIn: false,
      };

      await LocationService.createInputField(selectField);
      expect(
        requestStub.calledWith('input-fields', {
          method: 'POST',
          body: JSON.stringify(selectField),
          headers: { 'X-Qminder-API-Version': '2020-09-01' },
        }),
      ).toBeTruthy();
    });

    it('sends a NUMERIC field with constraints', async function () {
      const numericField: NumericFieldCreationRequest = {
        type: 'NUMERIC',
        id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
        location: { id: LOCATION_ID },
        title: 'Amount',
        constraints: { min: 0, max: 1000, scale: 2 },
        isMandatoryBeforeAdded: false,
        isMandatoryBeforeServed: true,
        isMandatoryInRemoteSignIn: false,
        isVisibleInWaitingDrawer: false,
        isVisibleInServingDrawer: true,
        visibleForLines: [],
        showInRemoteSignIn: false,
      };

      await LocationService.createInputField(numericField);
      expect(
        requestStub.calledWith('input-fields', {
          method: 'POST',
          body: JSON.stringify(numericField),
          headers: { 'X-Qminder-API-Version': '2020-09-01' },
        }),
      ).toBeTruthy();
    });

    it('sends a FIRST_NAME field with only base properties', async function () {
      const firstNameField: FirstNameFieldCreationRequest = {
        type: 'FIRST_NAME',
        id: 'f6a7b8c9-d0e1-2345-faba-456789012345',
        location: { id: LOCATION_ID },
        isMandatoryBeforeAdded: false,
        isMandatoryBeforeServed: false,
        isMandatoryInRemoteSignIn: false,
        isVisibleInWaitingDrawer: true,
        isVisibleInServingDrawer: true,
        visibleForLines: [],
        showInRemoteSignIn: false,
      };

      await LocationService.createInputField(firstNameField);
      expect(
        requestStub.calledWith('input-fields', {
          method: 'POST',
          body: JSON.stringify(firstNameField),
          headers: { 'X-Qminder-API-Version': '2020-09-01' },
        }),
      ).toBeTruthy();
    });
  });

  afterEach(function () {
    requestStub.restore();
  });
});
