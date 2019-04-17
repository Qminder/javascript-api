import ApiBase from '../api-base';
import User from '../model/User';
import Desk from '../model/Desk';
import Location from '../model/Location';
import Line from '../model/Line';
import { UserRole } from '../model/User';

/**
 * User Service
 */
export default class UserService {
  /**
   * List all Users in a Location.
   *
   * Returns an Array of all users that have access to a Location. (Owner, Administrators,
   * Location Managers, and Clerks)
   *
   * Calls this HTTP API: `GET /v1/locations/<ID>/users`
   *
   * For example:
   *
   * ```javascript
   * // Fetch the user list for location ID 1234
   * const locationId = 1234;
   * const users = await Qminder.users.list(locationId);
   * ```
   * @param location the Location to find all users for.
   * @returns a Promise that resolves to a list of Users who have access to the location, or
   * rejects when something went wrong.
   */
  static list(location: (Location|number)): Promise<Array<User>> {
    let locationId: any = location instanceof Location ? location.id : location;
    if (!locationId || typeof locationId !== 'number') {
      throw new Error('Location was not valid.');
    }
    return ApiBase.request(`locations/${locationId}/users`).then((users: { data: User[] }) => {
      if (!users.data) {
        throw new Error('User list response was invalid!');
      }
      return users.data.map(each => new User(each));
    });
  }

  /**
   * Create a new User.
   *
   * To create a new User, the user's email address, first and last name, and at least one
   * UserRole are needed.
   *
   * After creating the User, the person will receive an email asking them to reset their password.
   * When they reset their password, they can access Qminder based on their UserRoles.
   *
   * Calls the HTTP API `POST /v1/users/`
   *
   * @param {User} user an object filled with user details: the first/last name, email and
   * an array of UserRoles are mandatory.
   * @returns {Promise.<User>} a Promise that resolves with the new created User, or rejects if
   * something went wrong.
   * @throws Error when the user's first name, last name, email or roles are missing, or invalid.
   * @see UserRole
   */
  static create(user: User): Promise<User> {
    const { email, firstName, lastName, roles } = user;
    if (!email || typeof email !== 'string') {
      throw new Error('The user\'s email address is invalid or missing');
    }
    if (!firstName || typeof firstName !== 'string') {
      throw new Error('The user\'s first name is invalid or missing');
    }
    if (!lastName || typeof lastName !== 'string') {
      throw new Error('The user\'s last name is invalid or missing');
    }
    if (!roles) {
      throw new Error('The user\'s roles are missing');
    }
    return (ApiBase.request(`users/`, {
      email,
      firstName,
      lastName,
      roles: JSON.stringify(roles),
    }, 'POST') as Promise<User>);
  }
  /**
   * Fetch the user's details.
   *
   * This method allows searching by both user ID and exact email address. When searching by email
   * address, only exact matches are considered.
   *
   * Calls the HTTP API `GET /v1/users/<user>`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Get user details by their email address
   * const user = await Qminder.users.details("john@example.com");
   *
   * // Example 2. Get user details by user ID
   * const user = await Qminder.users.details(14152);
   *
   * // Example 3. Get user details by User object
   * const usersList: Array<User> = Qminder.users.list(1234);
   * let firstUser = usersList[0];
   * firstUser = await Qminder.users.details(firstUser);
   * ```
   * @param user The user, the user's ID, or the user's email address.
   * @returns a Promise that resolves to the user's details, and rejects when
   * something goes wrong.
   * @throws Error when the user argument was invalid (not a string, not a number, or not a User)
   */
  static details(user: number | string | User): Promise<User> {
    let search = null;
    if (user instanceof User) {
      search = user.id;
    } else {
      search = user;
    }

    if (!search) {
      throw new Error('User to search by was invalid. Searching only works by email or user ID or User object.');
    }

    return ApiBase.request(`users/${search}`).then((userResponse: User) => new User(userResponse));
  }

  /**
   * Removes the user.
   *
   * They will be deleted from the database and will not be able to log in any more.
   *
   * Calls the HTTP API `DELETE /users/<ID>`.
   *
   * @param user the user to delete
   * @returns a Promise that resolves when the user was removed, and rejects when
   * something goes wrong.
   * @throws Error when the argument is invalid (either the user ID is not a number, or the User
   * object did not have an ID).
   */
  static remove(user: (User|number)): Promise<{ success: true }> {
    let userId: any = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID was invalid');
    }
    return (ApiBase.request(`users/${userId}/`, undefined, 'DELETE') as Promise<{ success: true }>);
  }

  /**
   * Adds a new role to the user.
   * Roles are the method by which Qminder controls who can access which location, at what
   * access level.
   * For example, a User who has administrator privileges can access and modify all location
   * settings, for all locations.
   * However, a User who has clerk privileges can log in and serve visitors, but not modify any
   * location settings nor see service statistics.
   *
   * @param user the User that you want to add roles to
   * @param role the UserRole you want to add for the user.
   * @return a Promise that resolves when the role adding succeeded, and
   * rejects when something went wrong.
   */
  static addRole(user: User | number, role: UserRole): Promise<{ success: true }> {
    let userId: any = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return (ApiBase.request(`users/${userId}/roles`, role, 'POST') as Promise<{ success: true }>);
  }

  /**
   * Adds a profile picture to the user.
   * Calls the HTTP API `POST /v1/users/<ID>/picture`.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example. Set the user's picture from a File input
   * const picture: File = document.querySelector('input[type="file"]').files[0];
   * await Qminder.users.addPicture(1425, picture);
   * ```
   * @param user the user to add the profile picture to
   * @param {File} picture the picture data as a File object. Its file type will automatically
   * be added to the request's Content-Type.
   * @returns {Promise.<Object>} a Promise that resolves when adding the profile picture
   * succeeded, or rejects if something went wrong.
   */
  static addPicture(user: User | number, picture: File): Promise<Object> {
    let userId: any = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return ApiBase.request(`users/${userId}/picture`, picture);
  }

  /**
   * Removes the profile picture from the user.
   *
   * Calls the HTTP API `DELETE /v1/users/<ID>/picture`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Remove the user's profile picture
   * await Qminder.users.removePicture(1425);
   * // Example 2. Remove the user's profile picture, using the User object
   * const user = await Qminder.users.details(1234);
   * await Qminder.users.removePicture(user);
   * ```
   * @param user the user that the profile picture will be removed from.
   * @returns {Promise} a promise that resolves when it succeeds, and rejects when something
   * goes wrong.
   * @throws Error if the user object or user ID is invalid.
   */
  static removePicture(user: User | number): Promise<Object> {
    let userId: any = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return ApiBase.request(`users/${userId}/picture`, undefined, 'DELETE');
  }

  /**
   * Set the user's currently selected Desk.
   *
   * Calls the HTTP API `POST /v1/users/<ID>/desk`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example. Set the user 14152's desk to Desk 4
   * await Qminder.users.selectDesk(14152, 4);
   * ```
   * @param user The user to modify.
   * @param desk The desired desk.
   * @returns A promise that resolves when setting the desk works, and rejects
   * if it failed.
   */
  static selectDesk(user: User | number, desk: Desk | number) {
    let userId: any = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }

    let deskId: any = desk instanceof Desk ? desk.id : desk;
    if (!deskId || typeof deskId !== 'number') {
      throw new Error('Desk ID is invalid');
    }
    return ApiBase.request(`users/${userId}/desk`, { desk: deskId }, 'POST');
  }

  /**
   * Unset the user's currently selected Desk.
   *
   * After this API call, the user will have no desk selected.
   *
   * Calls the HTTP API `DELETE /v1/users/<ID>/desk`.
   * @param user The user to modify
   * @returns A promise that resolves when setting the desk works, and rejects if it failed.
   */
  static removeDesk(user: User | number): Promise<Object> {
    let userId: any = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return ApiBase.request(`users/${userId}/desk`, undefined, 'DELETE');
  }

  /**
   * Set the lines selected by current user. All other lines that aren't specified are set to unselected.
   *
   * Calls the HTTP API `POST /v1/users/<ID>/lines`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example. Set user 5342's selected lines to 12345, 54321, 98765
   * await Qminder.users.setLines(5342, [12345, 54321, 98765])
   * ```
   * @param user The user whose lines to set.
   * @param lines array of Line, or array of line IDs
   * @returns A promise that resolves when setting the lines works, and rejects
   * if it failed.
   */

  static setLines(user: User | number, lines: (Line | number)[]) {
    let userId: any = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }

    const isInstanceOfLines = lines.every((value: Line | number) => value instanceof Line);
    const isInstanceOfLineIds = lines.every((value: Line | number) => typeof value === 'number');

    if (isInstanceOfLines) {
      const lineIds = lines.map((line: Line) => line.id);
      return ApiBase.request(`users/${userId}/lines`, JSON.stringify(lineIds), 'POST');
    }

    if (isInstanceOfLineIds) {
      return ApiBase.request(`users/${userId}/lines`, JSON.stringify(lines), 'POST');
    }

    throw new Error('Lines isn\'t a list of Line or Line IDs');
  }

};
