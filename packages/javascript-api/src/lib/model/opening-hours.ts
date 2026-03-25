import { DayOpeningHours } from './day-opening-hours.js';

/**
 * Weekly opening hours for a location, with an entry for each day of the week.
 */
export interface OpeningHours {
  mon: DayOpeningHours;
  tue: DayOpeningHours;
  wed: DayOpeningHours;
  thu: DayOpeningHours;
  fri: DayOpeningHours;
  sat: DayOpeningHours;
  sun: DayOpeningHours;
}
