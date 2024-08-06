import { UUID } from '../uuid';

export type InputFieldRequest =
  | ValueInputFieldRequest
  | OptionIdsInputFieldRequest;

export interface ValueInputFieldRequest extends BaseInputFieldRequest {
  value: string | number;
}

export interface OptionIdsInputFieldRequest extends BaseInputFieldRequest {
  optionIds: UUID[];
}

interface BaseInputFieldRequest {
  inputFieldId: UUID;
}
