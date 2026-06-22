import { InputFieldBase } from './input-field-base.js';
import { InputFieldTranslation } from './input-field-translation.js';
import { AttachmentFieldConstraints } from './attachment-field-constraints.js';

export interface AttachmentFieldCreationRequest extends InputFieldBase {
  type: 'ATTACHMENT';
  title: string;
  visitorFacingTitle?: string;
  translations?: InputFieldTranslation[];
  constraints: AttachmentFieldConstraints;
}
