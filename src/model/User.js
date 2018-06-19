// @flow
import Location from './Location';
/**
 * Represents a single user picture.
 * The 'medium' sized user picture is available if the user has an image.
 */
type Picture = {
  size: 'small' | 'medium' | 'large',
  url: string,
};

/**
 * An enum of all available role types.
 *
 * `CLERK` - the user can only serve visitors and see the Welcome screen.<br>
 * `MANAGER` - the user can edit the settings and view stats of one location.<br>
 * `ADMINISTRATOR` - the user can edit and view all locations for the account.
 */
type RoleType = 'CLERK' | 'MANAGER' | 'ADMINISTRATOR';

/**
 * Represents a single user role.
 * If the role type is 'ADMINISTRATOR', there is no location specified.
 */
type UserRole = {
  id: number,
  type: RoleType,
  location?: number,
};

/**
 * Represents an employee. A User can log in to the Qminder Dashboard, manage (create/edit/call)
 * visitors, and potentially more if they have additional rights.
 *
 * Employees can have a profile picture, which will be scaled to potentially multiple sizes.
 * The 'medium' picture size is 200x200.
 */
class User {
  /**
   * This user's unique ID.
   * For example, 12345
   */
  id: number;
  /**
   * This user's email address.
   * They can use the email address to log in, and to receive Qminder notifications.
   * For example: 'jane.smith@example.com'.
   */
  email: string;
  /**
   * This user's first name.
   * For example, 'Jane'
   */
  firstName: string;
  /**
   * This user's last name.
   * For example, 'Smith'
   */
  lastName: string;
  /**
   * The user's currently selected desk.
   */
  desk: number;
  /**
   * The user's currently selected location.
   */
  selectedLocation: number;
  /**
   * This user's profile pictures, in various sizes. A 'medium' size is guaranteed.
   */
  picture: Array<Picture>;
  /**
   * The user's roles.
   */
  roles: Array<UserRole>;
  /**
   * Construct a User object.
   * @param properties either the User's ID, or a properties object.
   */
  constructor(properties: number | User) {
    if (typeof properties === 'number') {
      this.id = properties;
    } else {
      // $FlowFixMe: TODO: assign all properties the User supports, without writing them all out?
      Object.assign(this, properties);
    }
  }

  /**
   * Returns true if the user is an administrator.
   * It uses the user's roles object that can be loaded via Qminder.users.details().
   * The user is an administrator when their role list includes an ADMIN role.
   * @example
   * // Get the details of an user and find out if they are an admin, with ES6 async/await syntax.
   * const user = await Qminder.users.details(1234);
   * const isAdmin = user.isAdmin();
   * console.log(isAdmin);
   * @example
   * // Get the details of an user and find out if they are an admin, in plain JS
   * // note: this asynchronously loads the user data
   * Qminder.users.details(1234).then(function(user) {
   *   const isAdmin = user.isAdmin();
   *   console.log(isAdmin);
   * });
   * @returns {boolean} true if the user is an administrator, false if they are not.
   * @throws Error if the user's roles are not loaded.
   */
  isAdmin(): boolean {
    if (!this.roles) {
      throw new Error('User roles are not available. Please load the User via Qminder.users.details');
    }
    const adminRole = this.roles.find(role => role && role.type === 'ADMIN');
    return adminRole !== undefined;
  }

  /**
   * Returns true if the user is an Owner.
   * It uses the user's roles object that can be loaded via Qminder.users.details().
   * The user is an administrator when their role list includes an OWNER role.
   * An Owner role can do everything an Admin can, as well as manage billing.
   * @example
   * // Get the details of an user and find out if they are an owner, with ES6 async/await syntax.
   * const user = await Qminder.users.details(1234);
   * const isOwner = user.isOwner();
   * console.log(isOwner);
   * @example
   * // Get the details of an user and find out if they are an owner, in plain JS
   * // note: this asynchronously loads the user data
   * Qminder.users.details(1234).then(function(user) {
   *   const isOwner = user.isOwner();
   *   console.log(isOwner);
   * });
   * @returns {boolean} true if the user is an owner, false if they are not.
   * @throws Error if the user's roles are not loaded.
   */
  isOwner(): boolean {
    if (!this.roles) {
      throw new Error('User roles are not available. Please load the User via Qminder.users.details');
    }
    const ownerRole = this.roles.find(role => role && role.type === 'OWNER');
    return ownerRole !== undefined;
  }

  /**
   * Returns true if the user is a manager of the given location.
   * Looks at the user's roles which can be loaded via Qminder.users.details().
   * @example
   * // Get the details user 1234 and find out if they are an admin of Location ID 1114, using ES6
   * // async/await syntax
   * const user = await Qminder.users.details(1234);
   * const isManagerOfLocation = user.isManager(1114);
   * @param location  the location to check, for example 6901
   * @returns {boolean} true if the user is the manager of the location given
   * @throws
   */
  isManager(location: (Location|number)) {
    if (!this.roles) {
      throw new Error('User roles are not available. Please load the User via Qminder.users.details');
    }

    let locationId;

    if (typeof location === 'number') {
      locationId = location;
    } else {
      locationId = location.id;
    }

    if (typeof locationId !== 'number') {
      throw new Error('Invalid first argument. Please pass a number or a Qminder Location object.');
    }

    const managerRole = this.roles.find(role => role && role.type === 'MANAGER' && role.location === location);
    return managerRole !== undefined;
  }
}

export default User;
