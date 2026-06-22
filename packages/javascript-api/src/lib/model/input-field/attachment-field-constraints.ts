export interface AttachmentFieldConstraints {
  maxNumberOfFiles: number;
  allowedFileTypeGroups: AllowedFileTypeGroups;
}

export interface AllowedFileTypeGroups {
  mode: AllowMode;
  groups?: FileTypeGroup[];
}

export enum AllowMode {
  ALL = 'ALL',
  ONLY = 'ONLY',
}

export enum FileTypeGroup {
  IMAGES = 'IMAGES',
  DOCUMENTS = 'DOCUMENTS',
  ARCHIVES = 'ARCHIVES',
}
