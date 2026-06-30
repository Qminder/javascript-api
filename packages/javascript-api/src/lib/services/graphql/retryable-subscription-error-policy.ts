import {
  distinctUntilChanged,
  map,
  Observable,
  scan,
  shareReplay,
  startWith,
  Subject,
  take,
} from 'rxjs';

import { Logger } from '../../util/logger/logger.js';
import { calculateRandomizedExponentialBackoffTime } from '../../util/randomized-exponential-backoff/randomized-exponential-backoff.js';
import {
  isNonRetryableSubscriptionError,
  QminderGraphQLError,
} from './graphql-error.js';

const RETRYABLE_ERRORED_SUBSCRIPTIONS_RETRY_LIMIT = 5;

// To avoid haveAnyErrored returning 'false' temporarily if retrying errored
// subscriptions fails.
const RETRYABLE_ERRORED_SUBSCRIPTIONS_SUCCEEDED_DELAY_MS = 500;

/**
 * Transport-specific actions the policy delegates back to its owner: how to
 * re-issue a subscription, and how to surface a terminal error to its subscriber.
 */
export interface RetryableSubscriptionActions {
  retry(messageId: string): void;
  fail(messageId: string, errors: QminderGraphQLError[]): void;
}

/**
 * Decides what to do when a GraphQL subscription errors, independently of the
 * transport. Non-retryable errors are failed immediately; retryable ones are
 * tracked and retried as a batch with an exponential backoff, and after
 * {@link RETRYABLE_ERRORED_SUBSCRIPTIONS_RETRY_LIMIT} attempts they are failed.
 *
 * Exposes {@link haveAnyErrored$} so callers can observe whether any retryable
 * subscription error is currently outstanding.
 */
export class RetryableSubscriptionErrorPolicy {
  private readonly logger = new Logger('GraphQL');

  private readonly action$ = new Subject<
    | {
        readonly type: 'add';
        readonly messageId: string;
        readonly errors: QminderGraphQLError[];
      }
    | { readonly type: 'remove'; readonly messageId: string }
    | { readonly type: 'clear' }
  >();

  private readonly erroredSubscriptions$ = this.action$.pipe(
    scan((subscriptions, action) => {
      const result = new Map(subscriptions);
      switch (action.type) {
        case 'add':
          return result.set(action.messageId, action.errors);
        case 'remove':
          result.delete(action.messageId);
          return result;
        case 'clear':
          return new Map<string, QminderGraphQLError[]>();
      }
    }, new Map<string, QminderGraphQLError[]>()),
    startWith(new Map<string, QminderGraphQLError[]>()),
    shareReplay(1),
  );

  readonly haveAnyErrored$: Observable<boolean> =
    this.erroredSubscriptions$.pipe(
      map(({ size }) => !!size),
      distinctUntilChanged(),
    );

  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private successTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;

  constructor(private readonly actions: RetryableSubscriptionActions) {
    this.erroredSubscriptions$.subscribe();
  }

  /** Record that a subscription errored, retrying or failing it per policy. */
  recordError(messageId: string, errors: QminderGraphQLError[]): void {
    if (isNonRetryableSubscriptionError(errors)) {
      this.logger.error(
        `Non-retryable GraphQL subscription error: ${JSON.stringify(errors)}`,
      );
      this.action$.next({ type: 'remove', messageId });
      this.actions.fail(messageId, errors);
      return;
    }

    this.logger.warn(
      `Retryable GraphQL subscription error: ${JSON.stringify(errors)}`,
    );

    this.clearSuccessTimeout();
    this.action$.next({ type: 'add', messageId, errors });

    if (
      this.retryCount < RETRYABLE_ERRORED_SUBSCRIPTIONS_RETRY_LIMIT &&
      !this.retryTimeout
    ) {
      this.scheduleRetry();
    } else if (!this.retryTimeout) {
      this.failAll();
    }
  }

  /** Stop tracking a subscription (it produced data again, or completed). */
  forget(messageId: string): void {
    this.action$.next({ type: 'remove', messageId });
  }

  /** Clear all tracked state and pending timers (e.g. after a fresh connection). */
  reset(): void {
    this.clearTimeouts();
    this.retryCount = 0;
    this.action$.next({ type: 'clear' });
  }

  /** Stop pending timers without emitting state (teardown). */
  dispose(): void {
    this.clearTimeouts();
  }

  private scheduleRetry(): void {
    const retryCount = this.retryCount + 1;
    const delay = calculateRandomizedExponentialBackoffTime(retryCount);

    this.logger.info(
      `Retry (retry count: ${retryCount}) errored subscriptions in ${delay.toFixed(
        0,
      )}ms`,
    );

    this.retryTimeout = setTimeout(() => {
      this.retryAll();
      this.retryCount = retryCount;
      this.retryTimeout = null;
    }, delay);
  }

  private retryAll(): void {
    this.erroredSubscriptions$
      .pipe(
        take(1),
        map((subscriptions) => subscriptions.keys()),
      )
      .subscribe((messageIds) => {
        for (const messageId of messageIds) {
          this.actions.retry(messageId);
        }

        this.successTimeout = setTimeout(() => {
          this.action$.next({ type: 'clear' });
          this.retryCount = 0;
          this.successTimeout = null;
        }, RETRYABLE_ERRORED_SUBSCRIPTIONS_SUCCEEDED_DELAY_MS);
      });
  }

  private failAll(): void {
    this.logger.error(
      `Errored subscriptions retry limit (${RETRYABLE_ERRORED_SUBSCRIPTIONS_RETRY_LIMIT}) reached. Giving up after ${this.retryCount} retries`,
    );

    this.erroredSubscriptions$.pipe(take(1)).subscribe((subscriptions) => {
      for (const [messageId, errors] of subscriptions) {
        this.actions.fail(messageId, errors);
      }
    });
  }

  private clearTimeouts(): void {
    clearTimeout(this.retryTimeout ?? undefined);
    this.retryTimeout = null;
    this.clearSuccessTimeout();
  }

  private clearSuccessTimeout(): void {
    clearTimeout(this.successTimeout ?? undefined);
    this.successTimeout = null;
  }
}
