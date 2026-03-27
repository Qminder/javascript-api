import { InputFieldBase } from './input-field-base.js';

export interface EmailFieldCreationRequest extends InputFieldBase {
  type: 'EMAIL';
  isRequiredInAppointments: boolean;
}
