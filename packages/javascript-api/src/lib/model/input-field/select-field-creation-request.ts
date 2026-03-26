import { InputFieldBase } from './input-field-base.js';
import { InputFieldTranslation } from './input-field-translation.js';
import { SelectOption } from './select-option.js';

export interface SelectFieldCreationRequest extends InputFieldBase {
  type: 'SELECT';
  title: string;
  visitorFacingTitle?: string;
  multiSelect: boolean;
  options: SelectOption[];
  translations?: InputFieldTranslation[];
}
