import { InputFieldBase } from './input-field-base.js';
import { InputFieldTranslation } from './input-field-translation.js';
import { NumericFieldConstraints } from './numeric-field-constraints.js';

export interface NumericFieldCreationRequest extends InputFieldBase {
  type: 'NUMERIC';
  title: string;
  visitorFacingTitle?: string;
  translations?: InputFieldTranslation[];
  constraints?: NumericFieldConstraints;
}
