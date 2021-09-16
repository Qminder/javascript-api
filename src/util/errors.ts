import { GraphQLError } from 'graphql';

export class GraphQLApiError extends Error {
  message: string;
  constructor(errors: GraphQLError[]) {
    super();
    this.message = errors.map((error) => error.message).join('\n');
  }
}
