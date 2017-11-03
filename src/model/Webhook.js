// @flow
/**
 * A Webhook is a URL that Qminder sends automatic POST requests into, in order to notify
 * downstream listeners about various events such as ticket creation or location changes.
 */
class Webhook {
  id: number;
  secret: string;
  constructor(properties: number | Webhook) {
    if (typeof properties === 'number') {
      this.id = properties;
    } else {
      // $FlowFixMe
      Object.assign(this, properties);
    }
  }
}

export default Webhook;
