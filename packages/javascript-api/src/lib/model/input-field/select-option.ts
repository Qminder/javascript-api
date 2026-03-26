import { UUID } from '../uuid.js';
import { SelectOptionTranslation } from './select-option-translation.js';

export interface SelectOption {
  id: UUID;
  title: string;
  color?: string;
  translations?: SelectOptionTranslation[];
}
