import * as Qminder from '../../src/qminder-api';

function getUserWithRoles(roles: any) {
  const user = new Qminder.User(1);
  user.roles = roles;
  return user;
}
describe('User model', function () {
  const ADMIN_ROLE = { type: 'ADMIN', id: 14124 };
  const OWNER_ROLE = { type: 'OWNER', id: 14129 };
  const MANAGER_ROLE = { type: 'MANAGER', id: 14121, location: 12345 };
  const ANOTHER_MANAGER_ROLE = { type: 'MANAGER', id: 15, location: 1234 };
  const CLERK_ROLE = { type: 'CLERK', id: 400, location: 12345 };

  describe('isAdmin()', function () {
    it('returns true if the user is only an admin', function () {
      const user = getUserWithRoles([ADMIN_ROLE]);
      expect(user.isAdmin()).toBeTruthy();
    });
    it('returns true if the user has two roles, one has admin', function () {
      const user = getUserWithRoles([ADMIN_ROLE, MANAGER_ROLE]);
      const anotherUser = getUserWithRoles([MANAGER_ROLE, ADMIN_ROLE]);
      expect(user.isAdmin()).toBeTruthy();
      expect(anotherUser.isAdmin()).toBeTruthy();
    });
    it('returns false if the user is a clerk', function () {
      const user = getUserWithRoles([CLERK_ROLE]);
      expect(user.isAdmin()).toBeFalsy();
    });
    it('returns false if the user has one location manager role', function () {
      const user = getUserWithRoles([MANAGER_ROLE]);
      expect(user.isAdmin()).toBeFalsy();
    });
    it('returns false if the user has multiple location manager roles', function () {
      const user = getUserWithRoles([MANAGER_ROLE, ANOTHER_MANAGER_ROLE]);
      expect(user.isAdmin()).toBeFalsy();
    });
    it('returns false if the user has mixed clerk/LM roles', function () {
      const user = getUserWithRoles([
        MANAGER_ROLE,
        CLERK_ROLE,
        ANOTHER_MANAGER_ROLE,
      ]);
      expect(user.isAdmin()).toBeFalsy();
    });
    it('throws if user does not have any roles', function () {
      const user = getUserWithRoles(undefined);
      expect(() => user.isAdmin()).toThrow();
    });
  });

  describe('isOwner()', function () {
    it('returns true if the user is only an owner', function () {
      const user = getUserWithRoles([OWNER_ROLE]);
      expect(user.isOwner()).toBeTruthy();
    });
    it('returns true if the user has two roles, one of them Owner', function () {
      const user = getUserWithRoles([OWNER_ROLE, MANAGER_ROLE]);
      const anotherUser = getUserWithRoles([MANAGER_ROLE, OWNER_ROLE]);
      expect(user.isOwner()).toBeTruthy();
      expect(anotherUser.isOwner()).toBeTruthy();
    });
    it('returns false if the user is a clerk', function () {
      const user = getUserWithRoles([CLERK_ROLE]);
      expect(user.isOwner()).toBeFalsy();
    });
    it('returns false if the user has one location manager role', function () {
      const user = getUserWithRoles([MANAGER_ROLE]);
      expect(user.isOwner()).toBeFalsy();
    });
    it('returns false if the user has multiple location manager roles', function () {
      const user = getUserWithRoles([MANAGER_ROLE, ANOTHER_MANAGER_ROLE]);
      expect(user.isOwner()).toBeFalsy();
    });
    it('returns false if the user has mixed clerk/LM roles', function () {
      const user = getUserWithRoles([
        MANAGER_ROLE,
        CLERK_ROLE,
        ANOTHER_MANAGER_ROLE,
      ]);
      expect(user.isOwner()).toBeFalsy();
    });
    it('returns false if the user is an admin', function () {
      const user = getUserWithRoles([ADMIN_ROLE]);
      expect(user.isOwner()).toBeFalsy();
    });
    it('returns false if the user has mixed clerk/LM/Admin roles', function () {
      const user = getUserWithRoles([
        MANAGER_ROLE,
        CLERK_ROLE,
        ANOTHER_MANAGER_ROLE,
        ADMIN_ROLE,
      ]);
      expect(user.isOwner()).toBeFalsy();
    });
    it('returns true if the user has mixed clerk/LM/owner roles', function () {
      const user = getUserWithRoles([
        MANAGER_ROLE,
        CLERK_ROLE,
        ANOTHER_MANAGER_ROLE,
        OWNER_ROLE,
      ]);
      expect(user.isOwner()).toBeTruthy();
    });
    it('throws if user does not have any roles', function () {
      const user = getUserWithRoles(undefined);
      expect(() => user.isOwner()).toThrow();
    });
  });

  describe('isManager(location)', function () {
    it('returns true if the user is only a manager of 12345', function () {
      const user = getUserWithRoles([MANAGER_ROLE]);
      expect(user.isManager(12345)).toBeTruthy();
    });
    it('returns true if the user has two roles, one of them a manager of 12345', function () {
      const user = getUserWithRoles([ADMIN_ROLE, MANAGER_ROLE]);
      const anotherUser = getUserWithRoles([MANAGER_ROLE, ADMIN_ROLE]);
      expect(user.isManager(12345)).toBeTruthy();
      expect(anotherUser.isManager(12345)).toBeTruthy();
    });
    it('returns false if the user is a clerk', function () {
      const user = getUserWithRoles([CLERK_ROLE]);
      expect(user.isManager(12345)).toBeFalsy();
    });
    it('returns false if the user has one clerk role', function () {
      const user = getUserWithRoles([CLERK_ROLE]);
      expect(user.isManager(12345)).toBeFalsy();
    });
    it('returns false if the user has multiple roles but no manager roles', function () {
      const user = getUserWithRoles([CLERK_ROLE, ADMIN_ROLE]);
      expect(user.isManager(12345)).toBeFalsy();
    });
    it('returns false if the user has mixed clerk/admin roles', function () {
      const user = getUserWithRoles([CLERK_ROLE, ADMIN_ROLE]);
      expect(user.isManager(12345)).toBeFalsy();
    });

    it('works when a Location object is passed', function () {
      const location = new Qminder.Location(12345);
      const user = getUserWithRoles([CLERK_ROLE, ADMIN_ROLE]);
      expect(() => user.isManager(12345)).not.toThrow();
    });

    it('throws when no location is passed', function () {
      const user = getUserWithRoles([CLERK_ROLE, ADMIN_ROLE]);
      expect(() => (user.isManager as any)()).toThrow();
    });

    it('throws when an invalid object is passed', function () {
      const user = getUserWithRoles([CLERK_ROLE, ADMIN_ROLE]);
      expect(() => (user.isManager as any)([])).toThrow();
      expect(() => (user.isManager as any)({})).toThrow();
      expect(() => (user.isManager as any)(Qminder.User)).toThrow();
      expect(() => (user.isManager as any)('hello, world')).toThrow();
    });
  });
});
