import { UUID } from '../uuid';

export type InputFieldRequest =
  | ValueInputFieldRequest
  | OptionIdsInputFieldRequest
  | AttachmentIdsInputFieldRequest;

export interface ValueInputFieldRequest extends BaseInputFieldRequest {
  value: string | number;
}

export interface OptionIdsInputFieldRequest extends BaseInputFieldRequest {
  optionIds: UUID[];
}

export interface AttachmentIdsInputFieldRequest extends BaseInputFieldRequest {
  attachmentIds: UUID[];
}

interface BaseInputFieldRequest {
  inputFieldId: UUID;
}
