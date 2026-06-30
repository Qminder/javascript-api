import { GraphQLErrorExtensions, SourceLocation } from 'graphql';

/**
 * A GraphQL error as returned by the Qminder API over a subscription or query.
 */
export interface QminderGraphQLError {
  readonly message: string;
  readonly errorType?: string | null;
  readonly extensions?: GraphQLErrorExtensions | null;
  readonly sourcePreview?: string | null;
  readonly offendingToken?: string | null;
  readonly locations?: SourceLocation[] | null;
  readonly path?: (string | number)[] | null;
}

/**
 * GraphQL subscription error types that the server will never resolve on retry.
 * Subscriptions failing with one of these are surfaced to the caller immediately.
 */
const NON_RETRYABLE_SUBSCRIPTION_ERROR_TYPES = [
  'BAD_REQUEST',
  'FIELD_NOT_FOUND',
  'INVALID_ARGUMENT',
  'InvalidSyntax',
  'NOT_FOUND',
  'PERMISSION_DENIED',
  'ValidationError',
] as const;

/**
 * Whether any of the errors is a type the server will never resolve on retry,
 * meaning the subscription should fail immediately rather than be retried.
 */
export function isNonRetryableSubscriptionError(
  errors: QminderGraphQLError[],
): boolean {
  return errors
    .filter((error) => error.errorType)
    .some(({ errorType }) =>
      (NON_RETRYABLE_SUBSCRIPTION_ERROR_TYPES as unknown as string[]).includes(
        errorType,
      ),
    );
}
