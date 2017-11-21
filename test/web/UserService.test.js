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
  const pictureSort = (a, b) => pictureSizes[a.size] - pictureSizes[b.size];

  beforeEach(function() {
    Qminder.setKey('F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn');
    Qminder.setServer('local.api.qminderapp.com');

    // Stub ApiBase.request to feed specific data to API
    this.requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  afterEach(function() {
    Qminder.ApiBase.request.restore();
  });

  describe("list()", function() {
    beforeEach(function(done) {
      this.requestStub.withArgs(`locations/${LOCATION_ID}/users`).resolves({ data: USERS });

      Qminder.users.list(LOCATION_ID).then(users => {
        this.users = users;
        done();
      });
    });

    it("returns a list of Qminder.User objects", function() {
      const allAreInstances = this.users.reduce((acc, user) => acc && (user instanceof Qminder.User));
      expect(allAreInstances).toBeTruthy();
    });
    it("returns the right user IDs", function() {
      const returnedIds = this.users.map(user => user.id);
      const groundTruth = USERS.map(user => user.id);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returnedIds[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right email addresses", function() {
      const returned = this.users.map(user => user.email);
      const groundTruth = USERS.map(user => user.email);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right first names", function() {
      const returned = this.users.map(user => user.firstName);
      const groundTruth = USERS.map(user => user.firstName);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right last names", function() {
      const returned = this.users.map(user => user.lastName);
      const groundTruth = USERS.map(user => user.lastName);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i]).toBe(groundTruth[i]);
      }
    });
    it("returns the right pictures", function() {
      const returned = this.users.map(user => user.picture).sort(pictureSort);
      const groundTruth = USERS.map(user => user.picture).sort(pictureSort);

      for (let i = 0; i < groundTruth.length; i++) {
        expect(returned[i].url).toBe(groundTruth[i].url);
      }
    });
  });
  describe("create()", function() {
    // Qminder.users.create(userdata)

    it('Sends the user roles as a JSON array', function() {
      const user = new Qminder.User({
        email: 'test@qminder.com',
        firstName: 'Jon',
        lastName: 'Snow',
        roles: [
          {
            type: 'CLERK',
            location: 1234
          },
          {
            type: 'CLERK',
            location: 1235
          }
        ]
      });

      Qminder.users.create(user);
      expect(this.requestStub.calledWith('users/', sinon.match({
        roles: JSON.stringify(user.roles)
      }))).toBeTruthy();
    });
  });
  describe("details()", function() {
    // Qminder.users.details(userId|userEmail)
  });
  describe("remove()", function() {
    // Qminder.users.remove(user)
  });
  describe("addRole()", function() {
    // Qminder.users.addRole(user, role)
  });
  describe("addPicture()", function() {
    // Qminder.users.addPicture(user, picture)
  });
  describe("removePicture()", function() {
    // Qminder.users.removePicture(user)
  });
});
