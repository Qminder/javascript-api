import { UUID } from '../uuid.js';

export interface InputFieldBase {
  /** Client-generated UUID for this input field. */
  id: UUID;
  location: { id: number };
  isMandatoryBeforeAdded: boolean;
  isMandatoryBeforeServed: boolean;
  isMandatoryInRemoteSignIn: boolean;
  isVisibleInWaitingDrawer: boolean;
  isVisibleInServingDrawer: boolean;
  visibleForLines: { id: number }[];
  showInRemoteSignIn: boolean;
}
