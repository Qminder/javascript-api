import { OpeningHoursRange } from './opening-hours-range.js';

interface OpeningHoursExceptionBase {
  /** ISO date string, e.g. "2020-05-13" */
  date: string;
  /** Max 30 characters */
  closedReason?: string;
}

/**
 * Requires exactly one of `closed` or `businessHours`.
 */
export type OpeningHoursException =
  | (OpeningHoursExceptionBase & { closed: true; businessHours?: undefined })
  | (OpeningHoursExceptionBase & {
      businessHours: OpeningHoursRange[];
      closed?: undefined;
    });
