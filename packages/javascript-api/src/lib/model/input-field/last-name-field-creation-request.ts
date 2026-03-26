import { InputFieldBase } from './input-field-base.js';

export interface LastNameFieldCreationRequest extends InputFieldBase {
  type: 'LAST_NAME';
  isRequiredInAppointments?: boolean;
}
