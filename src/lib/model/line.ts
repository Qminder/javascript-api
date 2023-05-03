/**
 * Lines represent visitor queues. A Location can have as many lines as needed. Visitors can select
 * which line they queue up to on the iPad Sign-In App.
 *
 * For example, a university helpdesk could have lines such as "IT Help", "Account Help",
 * "Mentoring", and "Financials".

 * Lines additionally have a color, which is used in statistics views to show a common color for
 * one line.
 */
export interface Line {
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
}
