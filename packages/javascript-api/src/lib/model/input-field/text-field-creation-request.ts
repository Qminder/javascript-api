import { InputFieldBase } from './input-field-base.js';
import { InputFieldTranslation } from './input-field-translation.js';

export interface TextFieldCreationRequest extends InputFieldBase {
  type: 'TEXT';
  title: string;
  visitorFacingTitle?: string;
  translations?: InputFieldTranslation[];
}
