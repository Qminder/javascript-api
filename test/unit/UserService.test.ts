import * as Qminder from '../../src/qminder-api';
import * as sinon from 'sinon';

describe("UserService", function() {
  const LOCATION_ID = 673;
  const USERS = [
    {
      "id": 127,
      "email": "madli@example.com",
      "firstName": "Madli",
      "lastName": "Maasikas",
      "picture": [
        {
          "size": "medium",
          "url": "http://www.google.com"
        }
      ]
    },
    {
      "id": 245,
      "email": "kristjan@example.com",
      "firstName": "Kristjan",
      "lastName": "Kask",
      "picture": [
        {
          "size": "medium",
          "url": "http://www.google.com"
        }
      ]
    }
  ];
  const pictureSizes = { small: 1, medium: 2, large: 3 };
  const pictureSort = (a: { size: string }, b: { size: string }) => pictureSizes[a.size as 'small' | 'medium' | 'large'] - pictureSizes[b.size as 'small' | 'medium' | 'large'];
  let requestStub: sinon.SinonStub;

  beforeEach(function() {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');

    // Stub ApiBase.request to feed specific data to API
    requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  afterEach(function() {
    (Qminder.ApiBase.request as sinon.SinonStub).restore();
  });

  describe("list()", function() {
    let usersReply: any;
    beforeEach(function(done) {
      requestStub.withArgs(`locations/${LOCATION_ID}/users`).resolves({ data: USERS });

      Qminder.users.list(LOCATION_ID).then((users: Qminder.User[]) => {
        usersReply = users;
        done();
      });
    });

    it("returns the right user IDs", function() {
      const returnedIds = usersReply.map((user: Qminder.User) => user.id);
      const groundTruth = USERS.map(user => user.id);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returnedIds[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right email addresses", function() {
      const returned = usersReply.map((user: Qminder.User) => user.email);
      const groundTruth = USERS.map(user => user.email);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right first names", function() {
      const returned = usersReply.map((user: Qminder.User) => user.firstName);
      const groundTruth = USERS.map(user => user.firstName);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right last names", function() {
      const returned = usersReply.map((user: Qminder.User) => user.lastName);
      const groundTruth = USERS.map(user => user.lastName);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right pictures", function() {
      const returned = usersReply.map((user: Qminder.User) => user.picture[0]).sort(pictureSort);
      const groundTruth = USERS.map(user => user.picture[0]).sort(pictureSort);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i].url).toBe(groundTruth[i].url);
      }
    });
  });
  describe("create()", function() {
    // Qminder.users.create(userdata)

    it('Sends the user roles as a JSON array', function() {
      const user: Omit<Qminder.User, 'id' | 'desk' | 'selectedLocation' | 'picture'> = {
        email: 'test@qminder.com',
        firstName: 'Jon',
        lastName: 'Snow',
        roles: [
          {
            id: 1234,
            type: 'CLERK',
            location: 1234
          },
          {
            id: 1235,
            type: 'CLERK',
            location: 1235
          }
        ]
      };

      Qminder.users.create(user);
      expect(requestStub.calledWith('users/', sinon.match({
        roles: JSON.stringify(user.roles)
      }))).toBeTruthy();
    });
  });
  describe("details()", function() {
    // Qminder.users.details(userId|userEmail)
  });
  describe("addRole()", function() {
    // Qminder.users.addRole(user, role)
  });
  describe("setLines()" , function() {
    it("Works with a list of Line IDs", function() {
      Qminder.users.setLines(123, [1,2,3,4]);
      expect(requestStub.calledWith('users/123/lines', sinon.match(JSON.stringify([1,2,3,4])))).toBeTruthy();
    });

    it("Works with a list of Lines", function() {
      const lines = [
        {id: 1, name: 'Test', color:'#fff', disabled:false},
        {id: 2, name: 'Test', color:'#fff', disabled:false},
        {id: 3, name: 'Test', color:'#f00', disabled:false},
      ];

      Qminder.users.setLines(123, lines);
      expect(requestStub.calledWith('users/123/lines', sinon.match(JSON.stringify([1,2,3])))).toBeTruthy();
    });

    it("Does not break when mixing IDs and objects", function() {
      const lines = [
        1,
        {id: 2, name: 'Test', color:'#fff', disabled:false},
        {id: 3, name: 'Test', color:'#f00', disabled:false},
      ];
      expect(() => Qminder.users.setLines(123, lines)).not.toThrow();
    });
  });
});
