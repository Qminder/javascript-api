export interface RequestInit {
  method?: HTTPMethod;
  headers?: {
    [key: string]: string;
  };
  mode?: 'cors' | 'same-origin' | 'navigate' | 'no-cors';
  credentials?: 'omit' | 'same-origin' | 'include';
  cache?:
    | 'default'
    | 'force-cache'
    | 'no-cache'
    | 'no-store'
    | 'only-if-cached'
    | 'reload';
  body?: string | Blob;
  referrer?: string;
  referrerPolicy?:
    | ''
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
}

export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | 'DELETE'
  | 'CONNECT';
