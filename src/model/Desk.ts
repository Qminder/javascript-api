/**
 * Desks represent working stations in a service location. For example, a bank office would use
 * numbered desks to call visitors to a specific clerk or table.
 *
 * For example, Jane Doe works at Desk 3, or John Smith works at Desk 2.
 *
 * Clerks can select the desk they are using before servicing customers, by using the Service View.
 *
 * Customers will be informed of the desk they need to go to in the Apple TV app or via SMS.
 *
 * Desks need to be enabled in a Location to be able to use them.
 */
class Desk {
  /**
   * The desk's ID.
   *
   * This is used to select the desk, and call tickets to a specific desk.
   */
  id: number;

  /**
   * The desk's name.
   *
   * For numbered desks, this desk is a string containing the number, for example "4".
   */
  name: string;

  /**
   * Construct a new Desk object.
   * This can be done by passing the constructor an object with the keys { id, name }, or by
   * passing just the desk's number.
   *
   * For example:
   *
   *     const desk = new Desk({ id: 5, name: "Service" });
   *     console.log(desk.id);   // 5
   *     console.log(desk.name); // "Service"
   *
   *     const desk = new Desk(5);
   *     console.log(desk.id); // 5
   *     console.log(desk.name); // "5"
   *
   * @param properties either the desk number, or the desk's properties in one object. Even another
   * Desk works as a properties object.
   */
  constructor(properties: number | Desk) {
    if (typeof properties === 'number') {
      this.id = properties;
      this.name = `${properties}`;
    } else {
      Object.assign(this, properties);
      this.id = properties.id || parseInt(properties.name);
    }
  }
}

export default Desk;
