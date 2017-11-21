// @flow
import ApiBase from '../api-base';
import User from '../model/User';
import Desk from '../model/Desk';
import Location from '../model/Location';
import type UserRole from '../model/User';

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
   * GET /locations/{id}/users
   * @example <caption>Fetch the user list for location ID 1234</caption>
   * const location = 1234;
   * const users: Array<User> = await Qminder.users.list(location);
   * @param {number} location  the Location to find all users for.
   * @returns a Promise that resolves to a list of Users who have access
   * to the location, or rejects when something went wrong.
   */
  static list(location: (Location|number)): Promise<Array<User>> {
    let locationId: ?number = location instanceof Location ? location.id : location;
    if (!locationId || typeof locationId !== 'number') {
      throw new Error('Location was not valid.');
    }
    return ApiBase.request(`locations/${locationId}/users`).then(users => {
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
   * POST /users/
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
    return ApiBase.request(`users/`, {
      email,
      firstName,
      lastName,
      roles: JSON.stringify(roles),
    }, 'POST');
  }
  /**
   * Fetch the user's details.
   *
   * This method allows searching by both user ID and exact email address. When searching by email
   * address, only exact matches are considered.
   *
   * GET /users/{user}
   * @example <caption>Get user details by their email address</caption>
   * const user: User = await Qminder.users.details("john@example.com");
   * @example <caption>Get user details by user ID</caption>
   * const user: User = await Qminder.users.details(14152);
   * @example <caption>Get user details by User object</caption>
   * const usersList: Array<User> = Qminder.users.list(1234);
   * let firstUser: User = usersList[0];
   * firstUser = await Qminder.users.details(firstUser);
   * @param {string} user The user, the user's ID, or the user's email address.
   * @returns {Promise.<User>} a Promise that resolves to the user's details, and rejects when
   * something goes wrong.
   * @throws Error when the user argument was invalid (not a string, not a number, or not a User)
   */
  static details(user: number | string | User): Promise<User> {
    let search: ?(string | number) = null;
    if (user instanceof User) {
      search = user.id;
    } else {
      search = user;
    }

    if (!search) {
      throw new Error('User to search by was invalid. Searching only works by email or user ID or User object.');
    }

    return ApiBase.request(`users/${search}`).then(userResponse => new User(userResponse));
  }

  /**
   * Removes the user.
   *
   * They will be deleted from the database and will not be able to log in any more.
   *
   * DELETE /users/{id}
   * @param {User} user the user to delete
   * @returns {Promise.<Object>} a Promise that resolves when the user was removed, and rejects when
   * something goes wrong.
   * @throws Error when the argument is invalid (either the user ID is not a number, or the User
   * object did not have an ID).
   */
  static remove(user: (User|number)): Promise<*> {
    let userId: ?number = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID was invalid');
    }
    return ApiBase.request(`users/${userId}/`, undefined, 'DELETE');
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
   * @return {Promise.<Object>} a Promise that resolves when the role adding succeeded, and
   * rejects when something went wrong.
   */
  static addRole(user: User | number, role: UserRole): Promise<*> {
    let userId: ?number = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return ApiBase.request(`users/${userId}/roles`, role, 'POST');
  }

  /**
   * Adds a profile picture to the user.
   * POST /v1/users/<ID>/picture
   * @example <caption>Set the user's picture from a File input</caption>
   * const picture: File = document.querySelector('input[type="file"]').files[0];
   * await Qminder.users.addPicture(1425, picture);
   * @param user the user to add the profile picture to
   * @param {File} picture the picture data as a File object. Its file type will automatically
   * be added to the request's Content-Type.
   * @returns {Promise.<Object>} a Promise that resolves when adding the profile picture
   * succeeded, or rejects if something went wrong.
   */
  static addPicture(user: User | number, picture: File): Promise<*> {
    let userId: ?number = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return ApiBase.request(`users/${userId}/picture`, picture);
  }

  /**
   * Removes the profile picture from the user.
   * DELETE /v1/users/<ID>/picture
   * @example <caption>Remove the user's profile picture</caption>
   * await Qminder.users.removePicture(1425);
   * @example <caption>Remove the user's profile picture, using the User object </caption>
   * const user = await Qminder.users.details(1234);
   * await Qminder.users.removePicture(user);
   * @param user the user that the profile picture will be removed from.
   * @returns {Promise} a promise that resolves when it succeeds, and rejects when something
   * goes wrong.
   * @throws Error if the user object or user ID is invalid.
   */
  static removePicture(user: User | number): Promise<*> {
    let userId: ?number = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return ApiBase.request(`users/${userId}/picture`, undefined, 'DELETE');
  }

  /**
   * Set the user's currently selected Desk. <br>
   * POST /v1/users/<ID>/desk
   * @example <caption>Set the user 14152's desk to Desk 4</caption>
   * await Qminder.users.selectDesk(14152, 4);
   * @param user The user to modify.
   * @param desk The desired desk.
   * @returns {Promise.<Object>} A promise that resolves when setting the desk works, and rejects
   * if it failed.
   */
  static selectDesk(user: User | number, desk: Desk | number) {
    let userId: ?number = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }

    let deskId: ?number = desk instanceof Desk ? desk.id : desk;
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
   * DELETE /v1/users/<ID>/desk
   * @param user The user to modify
   * @returns {Promise.<*>} A promise that resolves when setting the desk works, and rejects
   * if it failed.
   */
  static removeDesk(user: User | number): Promise<*> {
    let userId: ?number = user instanceof User ? user.id : user;
    if (!userId || typeof userId !== 'number') {
      throw new Error('User ID is invalid');
    }
    return ApiBase.request(`users/${userId}/desk`, undefined, 'DELETE');
  }
};
