// @flow

import ApiBase from '../api-base';

/**
 * A service that lets the user query Qminder API via GraphQL statements.
 */
export default class GraphQLService {
  /**
   * Query Qminder API with GraphQL
   *
   * Send a GraphQL query to the Qminder API.
   *
   * When the query contains variables, make sure to fill them all in the second parameter.
   *
   * @example
   * // Figure out the selected location ID of the current user, with async/await
   * try {
   *     const response = await Qminder.graphql(`{ me { selectedLocation } }`);
   *     console.log(response.me.selectedLocation); // "12345"
   * } catch (error) {
   *     console.log(error);
   * }
   * @example
   * // Figure out the selected location ID of the current user, with promises
   * Qminder.graphql("{ me { selectedLocation } }").then(function(response) {
   *     console.log(response.me.selectedLocation);
   * }, function(error) {
   *     console.log(error);
   * });
   * @param query required: the query to send, for example '{ me { selectedLocation } }'
   * @param variables optional: additional variables for the query
   * @returns a promise that resolves to the query's results, or rejects if the query failed
   * @throws when the 'query' argument is undefined or an empty string
   */
  static query(query: string, variables?: { [string]: any }): Promise<Object> {
    if (!query || query.length === 0) {
      throw new Error('GraphQLService query expects a GraphQL query as its first argument');
    }
    return ApiBase.queryGraph(query, variables);
  }
}
