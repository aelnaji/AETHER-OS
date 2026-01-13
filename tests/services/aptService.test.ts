import { AptService, Package, SystemInfo } from '@/lib/services/aptService';
import { createMockSocket } from '@/tests/utils/mocks';

describe('AptService', () => {
  let aptService: AptService;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = createMockSocket();
    aptService = new AptService(mockSocket);
  });

  describe('constructor', () => {
    it('should initialize with provided socket', () => {
      expect(aptService).toBeDefined();
      expect(aptService).toHaveProperty('socket');
      expect(aptService.socket).toBe(mockSocket);
    });
  });

  describe('listInstalledPackages', () => {
    it('should return list of installed packages', async () => {
      const packages = await aptService.listInstalledPackages();

      expect(Array.isArray(packages)).toBe(true);
      expect(packages.length).toBeGreaterThan(0);
      packages.forEach(pkg => {
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('version');
        expect(pkg).toHaveProperty('installed', true);
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:list-installed', {}, expect.any(Function));
    });

    it('should handle errors when listing installed packages', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:list-installed') {
          callback({ error: 'Permission denied' });
        }
      });

      await expect(aptService.listInstalledPackages()).rejects.toThrow('Permission denied');
    });

    it('should return empty array when no packages installed', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:list-installed') {
          callback({ packages: null });
        }
      });

      const packages = await aptService.listInstalledPackages();
      expect(packages).toEqual([]);
    });
  });

  describe('searchPackages', () => {
    it('should search packages with query', async () => {
      const query = 'node';
      const packages = await aptService.searchPackages(query);

      expect(Array.isArray(packages)).toBe(true);
      expect(packages.length).toBeGreaterThan(0);
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:search', { query }, expect.any(Function));
    });

    it('should handle errors during package search', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:search') {
          callback({ error: 'Search service unavailable' });
        }
      });

      await expect(aptService.searchPackages('test')).rejects.toThrow('Search service unavailable');
    });

    it('should return empty array when no packages found', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:search') {
          callback({ packages: null });
        }
      });

      const packages = await aptService.searchPackages('nonexistent');
      expect(packages).toEqual([]);
    });
  });

  describe('getPackageInfo', () => {
    it('should return package information', async () => {
      const packageName = 'nodejs';
      const info = await aptService.getPackageInfo(packageName);

      expect(info).toHaveProperty('name', packageName);
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('dependencies');
      expect(info).toHaveProperty('maintainer');
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:info', { packageName }, expect.any(Function));
    });

    it('should handle errors when getting package info', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:info') {
          callback({ error: 'Package not found' });
        }
      });

      await expect(aptService.getPackageInfo('nonexistent')).rejects.toThrow('Package not found');
    });
  });

  describe('installPackage', () => {
    it('should install package successfully', async () => {
      const packageName = 'nginx';

      const progressUpdates: any[] = [];
      const onProgress = (operation: any) => {
        progressUpdates.push(operation);
      };

      await aptService.installPackage(packageName, onProgress);

      expect(mockSocket.emit).toHaveBeenCalledWith('apt:install', { packageName }, expect.any(Function));
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it('should install package without progress callback', async () => {
      const packageName = 'curl';

      await aptService.installPackage(packageName);

      expect(mockSocket.emit).toHaveBeenCalledWith('apt:install', { packageName }, expect.any(Function));
    });

    it('should handle installation errors', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:install') {
          callback({ success: false, error: 'Package not available' });
        }
      });

      await expect(aptService.installPackage('nonexistent')).rejects.toThrow('Package not available');
    });
  });

  describe('removePackage', () => {
    it('should remove package successfully', async () => {
      const packageName = 'nginx';

      const progressUpdates: any[] = [];
      const onProgress = (operation: any) => {
        progressUpdates.push(operation);
      };

      await aptService.removePackage(packageName, onProgress);

      expect(mockSocket.emit).toHaveBeenCalledWith('apt:remove', { packageName }, expect.any(Function));
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it('should handle removal errors', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:remove') {
          callback({ success: false, error: 'Package not installed' });
        }
      });

      await expect(aptService.removePackage('nonexistent')).rejects.toThrow('Package not installed');
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', async () => {
      const info = await aptService.getSystemInfo();

      expect(info).toHaveProperty('totalPackages');
      expect(info).toHaveProperty('installedPackages');
      expect(info).toHaveProperty('upgradablePackages');
      expect(info).toHaveProperty('diskUsage');
      expect(info).toHaveProperty('lastUpdate');
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:system-info', {}, expect.any(Function));
    });

    it('should return default system info on errors', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:system-info') {
          callback({ error: 'System info unavailable' });
        }
      });

      const info = await aptService.getSystemInfo();

      expect(info).toEqual({
        totalPackages: 0,
        installedPackages: 0,
        upgradablePackages: 0,
        diskUsage: '0 MB',
        lastUpdate: 'Never',
      });
    });
  });

  describe('updateCache', () => {
    it('should update package cache successfully', async () => {
      await aptService.updateCache();

      expect(mockSocket.emit).toHaveBeenCalledWith('apt:update', {}, expect.any(Function));
    });

    it('should handle cache update errors', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'apt:update') {
          callback({ success: false, error: 'Network error' });
        }
      });

      await expect(aptService.updateCache()).rejects.toThrow('Network error');
    });
  });

  describe('cleanCache', () => {
    it('should clean package cache successfully', async () => {
      await aptService.cleanCache();

      expect(mockSocket.emit).toHaveBeenCalledWith('apt:clean', {}, expect.any(Function));
    });
  });

  describe('autoremove', () => {
    it('should autoremove packages successfully', async () => {
      await aptService.autoremove();

      expect(mockSocket.emit).toHaveBeenCalledWith('apt:autoremove', {}, expect.any(Function));
    });
  });

  describe('upgradeAll', () => {
    it('should upgrade all packages successfully', async () => {
      const progressUpdates: any[] = [];
      const onProgress = (operation: any) => {
        progressUpdates.push(operation);
      };

      await aptService.upgradeAll(onProgress);

      expect(mockSocket.emit).toHaveBeenCalledWith('apt:upgrade', {}, expect.any(Function));
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('listUpgradable', () => {
    it('should return list of upgradable packages', async () => {
      const packages = await aptService.listUpgradable();

      expect(Array.isArray(packages)).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:list-upgradable', {}, expect.any(Function));
    });
  });
});