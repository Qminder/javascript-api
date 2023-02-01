import ApiBase, { SuccessResponse } from '../api-base';
import User, { UserRole } from '../model/user';
import Desk from '../model/desk';
import Location from '../model/location';
import Line from '../model/line';
import { extractId, extractIdToNumber, IdOrObject } from '../util/id-or-object';

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
   * Calls this HTTP API: `GET /v1/locations/<Id>/users`
   *
   * For example:
   *
   * ```javascript
   * // Fetch the user list for location Id 1234
   * const locationId = 1234;
   * const users = await Qminder.users.list(locationId);
   * ```
   * @param location the Location to find all users for.
   * @returns a Promise that resolves to a list of Users who have access to the location, or
   * rejects when something went wrong.
   */
  static list(location: IdOrObject<Location>): Promise<User[]> {
    const locationId = extractId(location);
    return ApiBase.request(`locations/${locationId}/users`).then(
      (users: { data: User[] }) => {
        if (!users.data) {
          throw new Error('User list response was invalid!');
        }
        return users.data as User[];
      },
    );
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
  static create(
    user: Pick<User, 'email' | 'firstName' | 'lastName' | 'roles'>,
  ): Promise<User> {
    const { email, firstName, lastName, roles } = user;
    if (!email || typeof email !== 'string') {
      throw new Error("The user's email address is invalid or missing");
    }
    if (!firstName || typeof firstName !== 'string') {
      throw new Error("The user's first name is invalid or missing");
    }
    if (!lastName || typeof lastName !== 'string') {
      throw new Error("The user's last name is invalid or missing");
    }
    if (!roles) {
      throw new Error("The user's roles are missing");
    }
    return ApiBase.request(
      `users/`,
      {
        email,
        firstName,
        lastName,
        roles: JSON.stringify(roles),
      },
      'POST',
    ) as Promise<User>;
  }
  /**
   * Fetch the user's details.
   *
   * This method allows searching by both user Id and exact email address. When searching by email
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
   * // Example 2. Get user details by user Id
   * const user = await Qminder.users.details(14152);
   *
   * // Example 3. Get user details by User object
   * const usersList: Array<User> = Qminder.users.list(1234);
   * let firstUser = usersList[0];
   * firstUser = await Qminder.users.details(firstUser);
   * ```
   * @param user The user, the user's Id, or the user's email address.
   * @returns a Promise that resolves to the user's details, and rejects when
   * something goes wrong.
   * @throws Error when the user argument was invalid (not a string, not a number, or not a User)
   */
  static details(userIdOrEmail: IdOrObject<User> | string): Promise<User> {
    const search = extractId(userIdOrEmail);

    if (!search) {
      throw new Error(
        'User to search by was invalid. Searching only works by email or user Id or User object.',
      );
    }

    return ApiBase.request(`users/${search}`) as Promise<User>;
  }

  /**
   * Set the user's currently selected Desk.
   *
   * Calls the HTTP API `POST /v1/users/<Id>/desk`
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
  static selectDesk(user: IdOrObject<User>, desk: IdOrObject<Desk>) {
    const userId = extractId(user);
    const deskId = extractId(desk);
    return ApiBase.request(`users/${userId}/desk`, { desk: deskId }, 'POST');
  }

  /**
   * Unset the user's currently selected Desk.
   *
   * After this API call, the user will have no desk selected.
   *
   * Calls the HTTP API `DELETE /v1/users/<Id>/desk`.
   * @param user The user to modify
   * @returns A promise that resolves when setting the desk works, and rejects if it failed.
   */
  static removeDesk(user: IdOrObject<User>): Promise<SuccessResponse> {
    const userId = extractId(user);
    return ApiBase.request(`users/${userId}/desk`, undefined, 'DELETE');
  }

  /**
   * Set the lines selected by current user. All other lines that aren't specified are set to unselected.
   *
   * Calls the HTTP API `POST /v1/users/<Id>/lines`
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

  static setLines(
    user: IdOrObject<User>,
    lines: IdOrObject<Line>[],
  ): Promise<SuccessResponse> {
    const userId = extractId(user);
    const lineIds = lines.map((line: IdOrObject<Line>) =>
      extractIdToNumber(line),
    );
    return ApiBase.request(
      `users/${userId}/lines`,
      JSON.stringify(lineIds),
      'POST',
    );
  }
}
