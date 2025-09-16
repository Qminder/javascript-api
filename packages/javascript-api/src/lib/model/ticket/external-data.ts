export type ExternalData = {
  fields?: ExternalDataField[];
};

export type ExternalDataField =
  | ExternalMessageField
  | ExternalTextualField
  | ExternalListField;

export interface ExternalMessageField {
  type: 'message';
  content: string;
  importance: 'info' | 'warning' | 'error';
}

export interface ExternalTextualField {
  type: 'text' | 'email' | 'phoneNumber';
  title: string;
  value: string;
}

export interface ExternalListItem {
  title: string;
  text?: string;
  url?: string;
  footer?: string;
  timestamp?: string;
}

export interface ExternalListField {
  type: 'list';
  title: string;
  items: ExternalListItem[];
}
