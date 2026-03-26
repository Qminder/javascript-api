import { DateFieldCreationRequest } from './date-field-creation-request.js';
import { EmailFieldCreationRequest } from './email-field-creation-request.js';
import { FirstNameFieldCreationRequest } from './first-name-field-creation-request.js';
import { LastNameFieldCreationRequest } from './last-name-field-creation-request.js';
import { NumericFieldCreationRequest } from './numeric-field-creation-request.js';
import { PhoneNumberFieldCreationRequest } from './phone-number-field-creation-request.js';
import { SelectFieldCreationRequest } from './select-field-creation-request.js';
import { TextFieldCreationRequest } from './text-field-creation-request.js';
import { UrlFieldCreationRequest } from './url-field-creation-request.js';

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
