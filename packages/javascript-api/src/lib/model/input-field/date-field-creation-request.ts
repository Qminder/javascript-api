import { InputFieldBase } from './input-field-base.js';
import { InputFieldTranslation } from './input-field-translation.js';

export interface DateFieldCreationRequest extends InputFieldBase {
  type: 'DATE';
  title: string;
  visitorFacingTitle?: string;
  translations?: InputFieldTranslation[];
}
