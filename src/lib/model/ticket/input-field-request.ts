import { UUID } from '../uuid';

/**
 * Set an input field of a ticket.
 *
 * One of 2 options are allowed:
 * (inputFieldId, value) or (inputFieldId, optionIds)
 */
export type InputFieldRequest =
  | ValueInputFieldRequest
  | OptionIdsInputFieldRequest;

interface BaseInputFieldRequest {
  inputFieldId: UUID;
}

/** Specify the value of a text, date or URL input field. */
export interface ValueInputFieldRequest extends BaseInputFieldRequest {
  /** The value of the input field. Max length: 500. */
  value: string;
}

/** Specify the value of a select input field. */
export interface OptionIdsInputFieldRequest extends BaseInputFieldRequest {
  optionIds: UUID[];
}
