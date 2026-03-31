import { LineAppointmentSettings } from './line-appointment-settings.js';
import { LineColor } from './line-color.js';
import { LineTranslation } from './line-translation.js';

export interface LineCreationRequest {
  name: string;
  color: LineColor;
  disabled?: boolean;
  translations?: LineTranslation[];
  appointmentSettings?: LineAppointmentSettings;
}
