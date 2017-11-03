/**
 * Lines represent visitor queues. A Location can have as many lines as needed. Visitors can select
 * which line they queue up to on the iPad Sign-In App.
 *
 * For example, a university helpdesk could have lines such as "IT Help", "Account Help",
 * "Mentoring", and "Financials".

 * Lines additionally have a color, which is used in statistics views to show a common color for
 * one line.
 */
class Line {
  /**
   * The line's ID.
   * This is the unique identifier for a given Line.
   */
  id: number;

  /**
   * The name of the line. For example, "Main Service".
   * This can be seen on the iPad, TV and on each ticket in the service screen.
   */
  name: string;
  /**
   * The color of the line, in hex notation. For example, "#00ff00"
   * This is used in statistics views for coloring charts.
   */
  color: string;
  /**
   * True if the line is disabled. If the line is disabled, it cannot be selected on the iPad
   * Sign-In App and on the Service View.
   */
  disabled: boolean;

  /**
   * Creates a new Line object.
   *
   * For example:
   *
   *    const line = new Line(5);
   *    console.log(line.id);       // 5
   *    console.log(line.name);     // undefined
   *
   * @param {number} properties the line's ID. Doesn't fill the other properties automatically.
   */
  /**
   * Creates a new Line object, filling in all of the provided fields. You can also copy another
   * Line by passing it to the constructor.
   *
   * For example:
   *
   *    const line = new Line({ id: 12345, name: 'Service', disabled: false });
   *    console.log(line.id);       // 12345
   *    console.log(line.name);     // 'Service'
   *    console.log(line.disabled); // false
   *
   * @param {Line} properties the line, or a plain object describing a line.
   * @param {number} properties.id the Line ID
   * @param {string} properties.name the line's name
   * @param {string} properties.color the line's color as a hexadecimal RGB color, ie "#00ff00"
   * @param {boolean} properties.disabled true if the line is currently disabled (unusable, but not
   * deleted)
   */
  constructor(properties: number | Line) {
    if (typeof properties === 'number') {
      this.id = properties;
    } else {
      // $FlowFixMe
      Object.assign(this, properties);
    }
  }
}

export default Line;
