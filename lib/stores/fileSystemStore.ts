import { create } from 'zustand';
import { FileEntry, AppMetadata } from '../types/file-system';

interface FileSystemState {
  files: Record<string, FileEntry>;
  installedApps: Record<string, AppMetadata>;
  currentDirectory: string;

  writeFile: (path: string, content: string) => void;
  readFile: (path: string) => string | undefined;
  deleteFile: (path: string) => void;
  listDirectory: (path: string) => FileEntry[];
  installApp: (appId: string, appName: string, icon: string) => void;
  uninstallApp: (appId: string) => void;
  getInstalledApps: () => AppMetadata[];
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  files: {},
  installedApps: {},
  currentDirectory: '/',

  writeFile: (path, content) => {
    const name = path.split('/').pop() || '';
    const now = new Date();
    set((state) => ({
      files: {
        ...state.files,
        [path]: {
          path,
          name,
          type: 'file',
          content,
          createdAt: state.files[path]?.createdAt || now,
          modifiedAt: now,
        },
      },
    }));
  },

  readFile: (path) => {
    return get().files[path]?.content;
  },

  deleteFile: (path) => {
    set((state) => {
      const newFiles = { ...state.files };
      delete newFiles[path];
      return { files: newFiles };
    });
  },

  listDirectory: (path) => {
    const allFiles = Object.values(get().files);
    return allFiles.filter((file) => {
      const parentDir = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
      return parentDir === path;
    });
  },

  installApp: (appId, appName, icon) => {
    set((state) => ({
      installedApps: {
        ...state.installedApps,
        [appId]: {
          id: appId,
          name: appName,
          icon,
          installed: true,
          installDate: new Date(),
        },
      },
    }));
  },

  uninstallApp: (appId) => {
    set((state) => {
      const newApps = { ...state.installedApps };
      delete newApps[appId];
      return { installedApps: newApps };
    });
  },

  getInstalledApps: () => {
    return Object.values(get().installedApps);
  },
}));
