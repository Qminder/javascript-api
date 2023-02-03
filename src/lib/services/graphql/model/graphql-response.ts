/**
 * The shape of the JSON response from the GraphQL API.
 */
export interface GraphqlResponse {
  /** An array that contains any GraphQL errors. */
  errors?: GraphqlError[];
  /** If the data was loaded without any errors, contains the requested object. */
  data?: object;
}

interface GraphqlError {
  message: string;
  errorType: string;
  validationErrorType?: string;
  queryPath: string[];
  path?: any;
  extensions?: any;
  locations: { line: number; column: number; sourceName: string }[];
}
