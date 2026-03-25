/**
 * A time of day represented as hours and minutes.
 */
export interface OpeningHoursTime {
  /** Hour of the day (0-23) */
  hours: number;
  /** Minute of the hour (0-59) */
  minutes: number;
}

/**
 * A time range during which a location is open for business.
 */
export interface OpeningHoursRange {
  opens: OpeningHoursTime;
  closes: OpeningHoursTime;
}

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
