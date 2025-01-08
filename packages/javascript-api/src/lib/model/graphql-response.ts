export type GraphqlResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface SuccessResponse<T> {
  data: T;
}

export interface ErrorResponse {
  errors: GraphqlError[];
}

export interface GraphqlError {
  message: string;
  errorType: string;
  validationErrorType?: string;
  queryPath: string[];
  path?: any;
  extensions?: any;
  locations: { line: number; column: number; sourceName: string }[];
}

export function isErrorResponse<T>(
  response: GraphqlResponse<T>,
): response is ErrorResponse {
  return Object.prototype.hasOwnProperty.call(response, 'errors');
}

export function isSuccessResponse<T>(
  response: GraphqlResponse<T>,
): response is SuccessResponse<T> {
  return Object.prototype.hasOwnProperty.call(response, 'data');
}
