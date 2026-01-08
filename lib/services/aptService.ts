import { Socket } from 'socket.io-client';

export interface Package {
  name: string;
  version: string;
  description: string;
  size: string;
  installed: boolean;
  upgradable: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  homepage: string;
  maintainer: string;
  dependencies: string[];
  size: string;
  installedSize: string;
  section: string;
  priority: string;
}

export interface SystemInfo {
  totalPackages: number;
  installedPackages: number;
  upgradablePackages: number;
  diskUsage: string;
  lastUpdate: string;
}

export interface PackageOperation {
  type: 'install' | 'remove' | 'update' | 'upgrade';
  packageName?: string;
  progress: number;
  status: string;
  output: string[];
}

export class AptService {
  private socket: Socket;
  private operationListeners: Map<string, (operation: PackageOperation) => void> = new Map();

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('apt:progress', (data: PackageOperation) => {
      const key = `${data.type}-${data.packageName || 'all'}`;
      const listener = this.operationListeners.get(key);
      if (listener) {
        listener(data);
      }
    });
  }

  async listInstalledPackages(): Promise<Package[]> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:list-installed', {}, (response: { packages: Package[]; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.packages || []);
        }
      });
    });
  }

  async searchPackages(query: string): Promise<Package[]> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:search', { query }, (response: { packages: Package[]; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.packages || []);
        }
      });
    });
  }

  async getPackageInfo(packageName: string): Promise<PackageInfo> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:info', { packageName }, (response: { info: PackageInfo; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.info);
        }
      });
    });
  }

  async installPackage(
    packageName: string,
    onProgress?: (operation: PackageOperation) => void
  ): Promise<void> {
    const key = `install-${packageName}`;
    
    if (onProgress) {
      this.operationListeners.set(key, onProgress);
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('apt:install', { packageName }, (response: { success: boolean; error?: string }) => {
        this.operationListeners.delete(key);
        
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Installation failed'));
        }
      });
    });
  }

  async removePackage(
    packageName: string,
    onProgress?: (operation: PackageOperation) => void
  ): Promise<void> {
    const key = `remove-${packageName}`;
    
    if (onProgress) {
      this.operationListeners.set(key, onProgress);
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('apt:remove', { packageName }, (response: { success: boolean; error?: string }) => {
        this.operationListeners.delete(key);
        
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Removal failed'));
        }
      });
    });
  }

  async updatePackage(
    packageName: string,
    onProgress?: (operation: PackageOperation) => void
  ): Promise<void> {
    const key = `update-${packageName}`;
    
    if (onProgress) {
      this.operationListeners.set(key, onProgress);
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('apt:update-package', { packageName }, (response: { success: boolean; error?: string }) => {
        this.operationListeners.delete(key);
        
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Update failed'));
        }
      });
    });
  }

  async upgradeAll(onProgress?: (operation: PackageOperation) => void): Promise<void> {
    const key = 'upgrade-all';
    
    if (onProgress) {
      this.operationListeners.set(key, onProgress);
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('apt:upgrade', {}, (response: { success: boolean; error?: string }) => {
        this.operationListeners.delete(key);
        
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Upgrade failed'));
        }
      });
    });
  }

  async updateCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:update', {}, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Cache update failed'));
        }
      });
    });
  }

  async cleanCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:clean', {}, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Cache clean failed'));
        }
      });
    });
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:system-info', {}, (response: { info: SystemInfo; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.info || {
            totalPackages: 0,
            installedPackages: 0,
            upgradablePackages: 0,
            diskUsage: '0 MB',
            lastUpdate: 'Never',
          });
        }
      });
    });
  }

  async listUpgradable(): Promise<Package[]> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:list-upgradable', {}, (response: { packages: Package[]; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.packages || []);
        }
      });
    });
  }

  async autoremove(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('apt:autoremove', {}, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Autoremove failed'));
        }
      });
    });
  }
}
