import { OpeningHoursRange } from './opening-hours-range.js';

/**
 * A date-specific exception to the regular opening hours schedule.
 *
 * Requires exactly one of `closed` or `businessHours`.
 */
export interface OpeningHoursException {
  /** ISO date string, e.g. "2020-05-13" */
  date: string;
  closed?: boolean;
  /** Reason for closure, max 30 characters */
  closedReason?: string;
  businessHours?: OpeningHoursRange[];
}
