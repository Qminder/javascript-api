/**
 * Represents a single user picture.
 * The 'medium' sized user picture is available if the user has an image.
 */
interface Picture {
  size: 'small' | 'medium' | 'large';
  url: string;
}

/**
 * An enum of all available role types.
 *
 * `CLERK` - the user can only serve visitors and see the Welcome screen.<br>
 * `MANAGER` - the user can edit the settings and view stats of one location.<br>
 * `ADMIN` - the user can edit and view all locations for the account.<br>
 * `OWNER` - the user has all rights over all locations in the account.
 */
type RoleType = 'CLERK' | 'MANAGER' | 'ADMIN' | 'OWNER';

/**
 * Represents a single user role.
 * If the role type is 'ADMINISTRATOR', there is no location specified.
 */
export interface UserRole {
  id: number;
  type: RoleType;
  location?: number;
}

/**
 * Represents an employee. A User can log in to the Qminder Dashboard, manage (create/edit/call)
 * visitors, and potentially more if they have additional rights.
 *
 * Employees can have a profile picture, which will be scaled to potentially multiple sizes.
 * The 'medium' picture size is 200x200.
 */
export interface User {
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
}
