import { InputFieldCreationRequest } from '../input-field/input-field-creation-request.js';
import { OpeningHours } from '../opening-hours.js';
import { OpeningHoursException } from '../opening-hours-exception.js';

export interface LocationCreationRequest {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  country: string;
  openingHours?: {
    regular?: OpeningHours;
    exceptions?: OpeningHoursException[];
  };
  inputFields?: InputFieldCreationRequest[];
  languages?: string[];
}
