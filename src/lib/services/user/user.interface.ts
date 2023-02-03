import {
	list,
	create,
	details,
	selectDesk,
	removeDesk,
	setLines,
} from './user';

export const User = {

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
	list,

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
	create,

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
	details,

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
	selectDesk,

	/**
	 * Unset the user's currently selected Desk.
	 *
	 * After this API call, the user will have no desk selected.
	 *
	 * Calls the HTTP API `DELETE /v1/users/<ID>/desk`.
	 * @param user The user to modify
	 * @returns A promise that resolves when setting the desk works, and rejects if it failed.
	 */
	removeDesk,

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
	setLines,
};