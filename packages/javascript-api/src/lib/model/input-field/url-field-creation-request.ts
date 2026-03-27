import { InputFieldBase } from './input-field-base.js';
import { InputFieldTranslation } from './input-field-translation.js';

export interface UrlFieldCreationRequest extends InputFieldBase {
  type: 'URL';
  title: string;
  translations?: InputFieldTranslation[];
}
