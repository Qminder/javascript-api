import { UUID } from '../uuid.js';

export type InputFieldType =
  | 'TEXT'
  | 'SELECT'
  | 'EMAIL'
  | 'PHONE_NUMBER'
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'URL'
  | 'DATE'
  | 'NUMERIC';

export interface InputFieldTranslation {
  languageCode: string;
  title?: string;
  visitorFacingTitle?: string;
}

export interface SelectOptionTranslation {
  languageCode: string;
  title?: string;
}

export interface SelectOption {
  /** Client-generated UUID for this option. */
  id: UUID;
  title: string;
  color?: string;
  translations?: SelectOptionTranslation[];
}

export interface NumericFieldConstraints {
  min?: number;
  max?: number;
  scale: number;
}

interface InputFieldBase {
  /** Client-generated UUID for this input field. */
  id: UUID;
  location: { id: number };
  isMandatoryBeforeAdded: boolean;
  isMandatoryBeforeServed: boolean;
  isMandatoryInRemoteSignIn: boolean;
  isVisibleInWaitingDrawer: boolean;
  isVisibleInServingDrawer: boolean;
  visibleForLines: { id: number }[];
  showInRemoteSignIn: boolean;
}

export interface TextFieldCreationRequest extends InputFieldBase {
  type: 'TEXT';
  title: string;
  visitorFacingTitle?: string;
  translations?: InputFieldTranslation[];
}

export interface SelectFieldCreationRequest extends InputFieldBase {
  type: 'SELECT';
  title: string;
  visitorFacingTitle?: string;
  multiSelect: boolean;
  options: SelectOption[];
  translations?: InputFieldTranslation[];
}

export interface EmailFieldCreationRequest extends InputFieldBase {
  type: 'EMAIL';
  isRequiredInAppointments: boolean;
}

export interface PhoneNumberFieldCreationRequest extends InputFieldBase {
  type: 'PHONE_NUMBER';
}

export interface FirstNameFieldCreationRequest extends InputFieldBase {
  type: 'FIRST_NAME';
}

export interface LastNameFieldCreationRequest extends InputFieldBase {
  type: 'LAST_NAME';
  isRequiredInAppointments?: boolean;
}

export interface UrlFieldCreationRequest extends InputFieldBase {
  type: 'URL';
  title: string;
  translations?: InputFieldTranslation[];
}

export interface DateFieldCreationRequest extends InputFieldBase {
  type: 'DATE';
  title: string;
  visitorFacingTitle?: string;
  translations?: InputFieldTranslation[];
}

export interface NumericFieldCreationRequest extends InputFieldBase {
  type: 'NUMERIC';
  title: string;
  visitorFacingTitle?: string;
  translations?: InputFieldTranslation[];
  constraints?: NumericFieldConstraints;
}

/**
 * A discriminated union of all input field creation request types.
 * The `type` field determines which properties are available.
 */
export type InputFieldCreationRequest =
  | TextFieldCreationRequest
  | SelectFieldCreationRequest
  | EmailFieldCreationRequest
  | PhoneNumberFieldCreationRequest
  | FirstNameFieldCreationRequest
  | LastNameFieldCreationRequest
  | UrlFieldCreationRequest
  | DateFieldCreationRequest
  | NumericFieldCreationRequest;
