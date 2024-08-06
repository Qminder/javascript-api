import { UUID } from '../uuid';

export type InputFieldRequest =
  | ValueInputFieldRequest
  | OptionIdsInputFieldRequest;

export interface ValueInputFieldRequest extends BaseInputFieldRequest {
  readonly value: string | number;
}

export interface OptionIdsInputFieldRequest extends BaseInputFieldRequest {
  readonly optionIds: UUID[];
}

interface BaseInputFieldRequest {
  readonly inputFieldId: UUID;
}
