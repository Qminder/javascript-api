import * as sinon from 'sinon';
import * as Qminder from '../../src/qminder-api';

describe('LineService', function () {
  const LINES = [
    { id: 71490, name: 'Front Desk', color: '#39cccc', disabled: false },
    { id: 64415, name: 'Scheduling', color: '#01ff70', disabled: false },
    { id: 71613, name: 'Pre-Service', color: '#b10dc9', disabled: false },
    {
      id: 54837,
      name: 'Financial Consultation',
      color: '#0074d9',
      disabled: false,
    },
    { id: 71615, name: 'Lab Notifications', color: '#aaaaaa', disabled: false },
  ];
  const LOCATION_ID = 673;
  let requestStub: sinon.SinonStub;

  let reply: any;

  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');

    // Stub ApiBase.request to feed specific data to API
    requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  afterEach(function () {
    (Qminder.ApiBase.request as sinon.SinonStub).restore();
  });

  describe('list()', function () {
    beforeEach(function (done) {
      requestStub
        .withArgs(`locations/${LOCATION_ID}/lines`)
        .resolves({ data: LINES });
      Qminder.lines.list(LOCATION_ID).then((lines) => {
        reply = lines;
        done();
      });
    });

    it('returns a list of Qminder.Line objects', function () {
      const allAreInstances = reply.every(
        (line: unknown) => line instanceof Qminder.Line,
      );
      expect(allAreInstances).toBeTruthy();
    });

    it('returns the right line IDs', function () {
      const lines = reply.map((x: Qminder.Line) => x.id);
      const correctLines = LINES.map((x) => x.id);

      for (let i = 0; i < correctLines.length; i++) {
        expect(lines[i]).toBe(correctLines[i]);
      }
    });

    it('the name of the line is correct', function () {
      const names = reply.map((x: Qminder.Line) => x.name);
      const correctNames = LINES.map((x) => x.name);

      for (let i = 0; i < correctNames.length; i++) {
        expect(names[i]).toBe(correctNames[i]);
      }
    });

    it('the color of the line is correct', function () {
      const colors = reply.map((x: Qminder.Line) => x.color);
      const correctColors = LINES.map((x) => x.color);

      for (let i = 0; i < correctColors.length; i++) {
        expect(colors[i]).toBe(correctColors[i]);
      }
    });
  });

  describe('update()', function () {
    beforeEach(function (done) {
      requestStub.withArgs('lines/71490').resolves({});
      done();
    });

    it('updates a line using Line object', function () {
      const line: Qminder.Line = {
        id: 71490,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      Qminder.lines.update(new Qminder.Line(line));
    });

    it('fails to update a line due to lacking ID', function () {
      const line: any = {
        id: null,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      expect(() => Qminder.lines.update(new Qminder.Line(line))).toThrowError();
    });

    it('fails to update a line due to lacking name', function () {
      const line: Qminder.Line = {
        id: 71490,
        name: null,
        color: '#39cccc',
        disabled: false,
      };
      expect(() => Qminder.lines.update(line)).toThrowError();
    });

    it('fails to update a line due to lacking color', function () {
      const line: Qminder.Line = {
        id: 71490,
        name: 'Front Desk',
        color: null,
        disabled: false,
      };
      expect(() => Qminder.lines.update(line)).toThrowError();
    });
  });

  describe('enable()', function () {
    beforeEach(function (done) {
      requestStub.withArgs('lines/71490/enable').resolves({});
      done();
    });

    it('enables a line using ID', function () {
      Qminder.lines.enable(71490);
    });

    it('enables a line using Line object', function () {
      const line = {
        id: 71490,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      Qminder.lines.enable(new Qminder.Line(line));
    });

    it('fails to enable a line due to no ID', function () {
      expect(() => Qminder.lines.enable(null)).toThrowError();
    });

    it('fails to enable a line due to line object lacking ID field', function () {
      const line: Qminder.Line = {
        id: null,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      expect(() => Qminder.lines.enable(new Qminder.Line(line))).toThrowError();
    });
  });

  describe('disable()', function () {
    beforeEach(function (done) {
      requestStub.withArgs('lines/71490/disable').resolves({});
      done();
    });

    it('disables a line using ID', function () {
      Qminder.lines.disable(71490);
    });

    it('disables a line using Line object', function () {
      const line = {
        id: 71490,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      Qminder.lines.disable(new Qminder.Line(line));
    });

    it('fails to disable a line due to no ID', function () {
      expect(() => Qminder.lines.disable(null)).toThrowError();
    });

    it('fails to disable a line due to line object lacking ID field', function () {
      const line: Qminder.Line = {
        id: null,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      expect(() =>
        Qminder.lines.disable(new Qminder.Line(line)),
      ).toThrowError();
    });
  });

  describe('archive()', function () {
    beforeEach(function (done) {
      requestStub.withArgs('lines/71490/archive').resolves({});
      done();
    });

    it('archive a line using ID', function () {
      Qminder.lines.archive(71490);
    });

    it('archive a line using Line object', function () {
      const line = {
        id: 71490,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      Qminder.lines.archive(new Qminder.Line(line));
    });

    it('fails to archive a line due to no ID', function () {
      expect(() => Qminder.lines.archive(null)).toThrowError();
    });

    it('fails to archive a line due to line object lacking ID field', function () {
      const line: Qminder.Line = {
        id: null,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      expect(() =>
        Qminder.lines.archive(new Qminder.Line(line)),
      ).toThrowError();
    });
  });

  describe('unarchive()', function () {
    beforeEach(function (done) {
      requestStub.withArgs('lines/71490/unarchive').resolves({});
      done();
    });

    it('unarchive a line using ID', function () {
      Qminder.lines.unarchive(71490);
    });

    it('unarchive a line using Line object', function () {
      const line = {
        id: 71490,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      Qminder.lines.unarchive(new Qminder.Line(line));
    });

    it('fails to unarchive a line due to no ID', function () {
      expect(() => Qminder.lines.unarchive(null)).toThrowError();
    });

    it('fails to unarchive a line due to line object lacking ID field', function () {
      const line: Qminder.Line = {
        id: null,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      expect(() =>
        Qminder.lines.unarchive(new Qminder.Line(line)),
      ).toThrowError();
    });
  });

  describe('delete()', function () {
    beforeEach(function (done) {
      requestStub.withArgs('lines/71490/delete').resolves({});
      done();
    });

    it('delete a line using ID', function () {
      Qminder.lines.delete(71490);
    });

    it('delete a line using Line object', function () {
      const line = {
        id: 71490,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      Qminder.lines.delete(new Qminder.Line(line));
    });

    it('fails to delete a line due to no ID', function () {
      expect(() => Qminder.lines.delete(null)).toThrowError();
    });

    it('fails to delete a line due to line object lacking ID field', function () {
      const line: Qminder.Line = {
        id: null,
        name: 'Front Desk',
        color: '#39cccc',
        disabled: false,
      };
      expect(() => Qminder.lines.delete(new Qminder.Line(line))).toThrowError();
    });
  });
});
