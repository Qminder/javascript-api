import { OpeningHoursRange } from './opening-hours-range.js';

/**
 * Requires exactly one of `closed` or `businessHours`.
 */
export interface OpeningHoursException {
  /** ISO date string, e.g. "2020-05-13" */
  date: string;
  closed?: boolean;
  /** Max 30 characters */
  closedReason?: string;
  businessHours?: OpeningHoursRange[];
}
