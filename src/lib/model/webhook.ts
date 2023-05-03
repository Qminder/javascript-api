import { Id } from './id.js';
/**
 * A Webhook is a URL that Qminder sends automatic POST requests into, in order to notify
 * downstream listeners about various events such as ticket creation or location changes.
 */

export interface Webhook {
  id: Id;
  secret: string;
}
