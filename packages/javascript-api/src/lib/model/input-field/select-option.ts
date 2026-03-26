import { UUID } from '../uuid.js';
import { SelectOptionTranslation } from './select-option-translation.js';

export interface SelectOption {
  /** Client-generated UUID for this option. */
  id: UUID;
  title: string;
  color?: string;
  translations?: SelectOptionTranslation[];
}
