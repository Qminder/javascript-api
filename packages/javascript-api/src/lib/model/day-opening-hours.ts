import { OpeningHoursRange } from './opening-hours-range.js';

/**
 * Opening hours configuration for a single day of the week.
 *
 * - Set `businessHours` to specify time ranges when the location is open.
 * - Set `closed` to `true` to mark the day as closed.
 * - Leave both unset to indicate the location is open all day.
 *
 * `businessHours` and `closed` are mutually exclusive.
 */
export interface DayOpeningHours {
  businessHours?: OpeningHoursRange[];
  closed?: boolean;
}
