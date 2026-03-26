import { LineRef } from './line-ref.js';
import { LocationRef } from './location-ref.js';
import { UUID } from '../uuid.js';

export interface InputFieldBase {
  id: UUID;
  location: LocationRef;
  isMandatoryBeforeAdded: boolean;
  isMandatoryBeforeServed: boolean;
  isMandatoryInRemoteSignIn: boolean;
  isVisibleInWaitingDrawer: boolean;
  isVisibleInServingDrawer: boolean;
  visibleForLines: LineRef[];
  showInRemoteSignIn: boolean;
}
