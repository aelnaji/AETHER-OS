import { create } from 'zustand';
import { FileEntry, AppMetadata } from '@/lib/types/file-system';

interface FileSystemStore {
  files: Map<string, FileEntry>;
  installedApps: Map<string, AppMetadata>;
  currentDirectory: string;
  writeFile: (path: string, content: string) => void;
  readFile: (path: string) => string | null;
  deleteFile: (path: string) => void;
  createDirectory: (path: string) => void;
  listDirectory: (path: string) => FileEntry[];
  installApp: (appId: string, appName: string, icon: string) => void;
  uninstallApp: (appId: string) => void;
  getInstalledApps: () => AppMetadata[];
  setCurrentDirectory: (path: string) => void;
}

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  files: new Map(),
  installedApps: new Map(),
  currentDirectory: '/',

  writeFile: (path: string, content: string) => {
    set((state) => {
      const newFiles = new Map(state.files);
      const existingFile = state.files.get(path);
      const now = new Date();

      const fileEntry: FileEntry = {
        path,
        name: path.split('/').pop() || '',
        type: 'file',
        content,
        createdAt: existingFile?.createdAt || now,
        modifiedAt: now,
      };

      newFiles.set(path, fileEntry);
      return { files: newFiles };
    });
  },

  readFile: (path: string) => {
    const file = get().files.get(path);
    return file?.content || null;
  },

  deleteFile: (path: string) => {
    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.delete(path);
      return { files: newFiles };
    });
  },

  createDirectory: (path: string) => {
    set((state) => {
      const newFiles = new Map(state.files);
      const now = new Date();

      const directoryEntry: FileEntry = {
        path,
        name: path.split('/').pop() || '',
        type: 'directory',
        createdAt: now,
        modifiedAt: now,
      };

      newFiles.set(path, directoryEntry);
      return { files: newFiles };
    });
  },

  listDirectory: (path: string) => {
    const { files } = get();
    const normalizedPath = path.endsWith('/') ? path : `${path}/`;
    
    const entries: FileEntry[] = [];
    
    files.forEach((file) => {
      if (file.path.startsWith(normalizedPath) && file.path !== normalizedPath) {
        const relativePath = file.path.substring(normalizedPath.length);
        if (!relativePath.includes('/') || (relativePath.endsWith('/') && relativePath.split('/').length === 2)) {
          entries.push(file);
        }
      }
    });

    return entries.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  },

  installApp: (appId: string, appName: string, icon: string) => {
    set((state) => {
      const newInstalledApps = new Map(state.installedApps);
      const appMetadata: AppMetadata = {
        id: appId,
        name: appName,
        icon,
        installed: true,
        installDate: new Date(),
      };
      newInstalledApps.set(appId, appMetadata);
      return { installedApps: newInstalledApps };
    });
  },

  uninstallApp: (appId: string) => {
    set((state) => {
      const newInstalledApps = new Map(state.installedApps);
      newInstalledApps.delete(appId);
      return { installedApps: newInstalledApps };
    });
  },

  getInstalledApps: () => {
    return Array.from(get().installedApps.values());
  },

  setCurrentDirectory: (path: string) => {
    set({ currentDirectory: path });
  },
}));
