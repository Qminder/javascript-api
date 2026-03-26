import { DayOpeningHours } from './day-opening-hours.js';

export interface OpeningHours {
  mon: DayOpeningHours;
  tue: DayOpeningHours;
  wed: DayOpeningHours;
  thu: DayOpeningHours;
  fri: DayOpeningHours;
  sat: DayOpeningHours;
  sun: DayOpeningHours;
}
