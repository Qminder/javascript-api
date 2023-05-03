import { ApiBase, SuccessResponse } from '../api-base/api-base';
import { User } from '../../model/user';
import { Desk } from '../../model/desk';
import { Location } from '../../model/location';
import { Line } from '../../model/line';
import {
  extractId,
  extractIdToNumber,
  IdOrObject,
} from '../../util/id-or-object';

export function list(location: IdOrObject<Location>): Promise<User[]> {
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

export function create(
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

export function details(
  userIdOrEmail: IdOrObject<User> | string,
): Promise<User> {
  const search = extractId(userIdOrEmail);

  if (!search) {
    throw new Error(
      'User to search by was invalid. Searching only works by email or user ID or User object.',
    );
  }

  return ApiBase.request(`users/${search}`) as Promise<User>;
}

export function selectDesk(user: IdOrObject<User>, desk: IdOrObject<Desk>) {
  const userId = extractId(user);
  const deskId = extractId(desk);
  return ApiBase.request(`users/${userId}/desk`, { desk: deskId }, 'POST');
}

export function removeDesk(user: IdOrObject<User>): Promise<SuccessResponse> {
  const userId = extractId(user);
  return ApiBase.request(`users/${userId}/desk`, undefined, 'DELETE');
}

export function setLines(
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
