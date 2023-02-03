/**
 * Represents a custom field attached to a Ticket.
 * Users can define custom fields to show in the Service Screen. Those custom fields will be
 * stored in ticket extras.
 *
 * The title of a TicketExtra is the heading shown above the input field.
 * The value of a TicketExtra is the string typed into the input field, or the string value
 * selected in the dropdown. For multiselect fields, multiple TicketExtras are generated, one
 * for each value.
 *
 * For example, if the Location has an input field "Order ID" with the Text type, the
 * TicketExtra would look like this:
 *
 * ```
 * { "title": "Order ID", "value": "AB1234CDEF" }
 * ```
 *
 * If the Location has a Select input field named "Favorite Greek Letter" that has two options,
 * "Alpha" and "Beta", and "Beta" is selected, then the TicketExtra looks like this:
 *
 * ```
 * { "title": "Favorite Greek Letter", "value": "Alpha" }
 * ```
 *
 * If both Alpha and Beta are selected, then two TicketExtras are created:
 *
 * ```
 * { "title": "Favorite Greek Letter", "value": "Alpha" },
 * { "title": "Favorite Greek Letter", "value": "Beta" }
 * ```
 *
 * If the custom field is an hyperlink, then the URL of the link is stored in the "url"
 * property, and the title is always assigned to "Open".
 *
 * For example, for a custom hyperlink called "Twitter Page", this would be:
 *
 * ```
 * { "title": "Twitter Page", "value": "Open", "url": "https://www.twitter.com/" }
 * ```
 */
export interface TicketExtra {
	title: string;
	value: string;
	url?: string;
}