export type FileEntryType = 'file' | 'directory';

export interface FileEntry {
  path: string;
  name: string;
  type: FileEntryType;
  content?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface AppMetadata {
  id: string;
  name: string;
  icon: string;
  installed: boolean;
  installDate?: Date;
}

export interface DirectoryContent {
  entries: FileEntry[];
}
