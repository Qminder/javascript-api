import { OpeningHoursRange } from './opening-hours-range.js';

/**
 * `businessHours` and `closed` are mutually exclusive. Neither means open all day.
 */
export type DayOpeningHours =
  | { businessHours: OpeningHoursRange[]; closed?: undefined }
  | { closed: true; businessHours?: undefined }
  | Record<string, never>;
