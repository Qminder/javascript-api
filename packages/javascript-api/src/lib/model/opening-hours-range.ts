import { OpeningHoursTime } from './opening-hours-time.js';

/**
 * A time range during which a location is open for business.
 */
export interface OpeningHoursRange {
  opens: OpeningHoursTime;
  closes: OpeningHoursTime;
}
