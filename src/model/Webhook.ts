/**
 * A Webhook is a URL that Qminder sends automatic POST requests into, in order to notify
 * downstream listeners about various events such as ticket creation or location changes.
 */
export default interface Webhook {
  id: number;
  secret: string;
}
