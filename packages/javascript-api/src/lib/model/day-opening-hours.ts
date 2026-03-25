import { OpeningHoursRange } from './opening-hours-range.js';

/**
 * `businessHours` and `closed` are mutually exclusive. Neither means open all day.
 */
export interface DayOpeningHours {
  businessHours?: OpeningHoursRange[];
  closed?: boolean;
}
