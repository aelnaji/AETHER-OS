export type FileType = 'file' | 'directory';

export interface FileEntry {
  path: string;
  name: string;
  type: FileType;
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
  path: string;
  entries: FileEntry[];
}
