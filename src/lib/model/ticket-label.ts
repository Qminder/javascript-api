/**
 * Represents a ticket label.
 *
 * Tickets can have one or more labels, each identified by their 'value' string. The color of a
 * label is automatically generated.
 *
 * The color of a label is a 24-bit RGB hex color, without the hash mark (#) prefix.
 *
 * For example: { "value": "Has documents", "color": "00FF00" }
 */
export interface TicketLabel {
	value: string;
	color: string;
}
