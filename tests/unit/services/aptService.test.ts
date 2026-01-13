import { AptService, Package, PackageInfo, SystemInfo, PackageOperation } from '@/lib/services/aptService';
import { Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('AptService', () => {
  let mockSocket: Socket;
  let aptService: AptService;

  beforeEach(() => {
    mockSocket = new (require('socket.io-client').Socket)();
    aptService = new AptService(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listInstalledPackages', () => {
    it('should return installed packages', async () => {
      const mockPackages: Package[] = [
        { name: 'nodejs', version: '18.0.0', description: 'Node.js runtime', size: '100MB', installed: true, upgradable: false },
        { name: 'nginx', version: '1.25.0', description: 'Web server', size: '50MB', installed: true, upgradable: true },
      ];
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:list-installed' && callback) {
          callback({ packages: mockPackages });
        }
      });

      const packages = await aptService.listInstalledPackages();
      
      expect(packages).toEqual(mockPackages);
    });

    it('should handle errors when listing installed packages', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:list-installed' && callback) {
          callback({ error: 'Failed to list packages' });
        }
      });

      await expect(aptService.listInstalledPackages()).rejects.toThrow('Failed to list packages');
    });
  });

  describe('searchPackages', () => {
    it('should search for packages', async () => {
      const mockPackages: Package[] = [
        { name: 'nodejs', version: '18.0.0', description: 'Node.js runtime', size: '100MB', installed: false, upgradable: false },
        { name: 'nodejs-dev', version: '18.0.0', description: 'Node.js development files', size: '50MB', installed: false, upgradable: false },
      ];
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:search' && callback) {
          callback({ packages: mockPackages });
        }
      });

      const packages = await aptService.searchPackages('nodejs');
      
      expect(packages).toEqual(mockPackages);
    });

    it('should handle search errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:search' && callback) {
          callback({ error: 'Search failed' });
        }
      });

      await expect(aptService.searchPackages('nonexistent')).rejects.toThrow('Search failed');
    });
  });

  describe('getPackageInfo', () => {
    it('should return package information', async () => {
      const mockInfo: PackageInfo = {
        name: 'nodejs',
        version: '18.0.0',
        description: 'Node.js runtime',
        homepage: 'https://nodejs.org',
        maintainer: 'Node.js Foundation',
        dependencies: ['libssl', 'zlib'],
        size: '100MB',
        installedSize: '250MB',
        section: 'web',
        priority: 'optional',
      };
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:info' && callback) {
          callback({ info: mockInfo });
        }
      });

      const info = await aptService.getPackageInfo('nodejs');
      
      expect(info).toEqual(mockInfo);
    });

    it('should handle package info errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:info' && callback) {
          callback({ error: 'Package not found' });
        }
      });

      await expect(aptService.getPackageInfo('nonexistent-package')).rejects.toThrow('Package not found');
    });
  });

  describe('installPackage', () => {
    it('should install package successfully', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:install' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      const onProgress = jest.fn();
      await aptService.installPackage('nodejs', onProgress);
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should call progress callback during installation', async () => {
      const onProgress = jest.fn();
      
      // Mock the install operation
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:install' && callback) {
          // Simulate a progress update
          mockSocket.emit('apt:progress', {
            type: 'install',
            packageName: 'nodejs',
            progress: 50,
            status: 'Downloading',
            output: ['Downloading package...'],
          });
          callback({ success: true });
        }
      });

      await aptService.installPackage('nodejs', onProgress);
      
      // Progress callback should have been called
      expect(onProgress).toHaveBeenCalled();
    });

    it('should handle installation errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:install' && callback) {
          callback({ success: false, error: 'Installation failed' });
        }
      });

      await expect(aptService.installPackage('invalid-package')).rejects.toThrow('Installation failed');
    });
  });

  describe('removePackage', () => {
    it('should remove package successfully', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:remove' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      const onProgress = jest.fn();
      await aptService.removePackage('nodejs', onProgress);
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle removal errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:remove' && callback) {
          callback({ success: false, error: 'Removal failed' });
        }
      });

      await expect(aptService.removePackage('nonexistent-package')).rejects.toThrow('Removal failed');
    });
  });

  describe('updatePackage', () => {
    it('should update package successfully', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:update-package' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      const onProgress = jest.fn();
      await aptService.updatePackage('nodejs', onProgress);
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle update errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:update-package' && callback) {
          callback({ success: false, error: 'Update failed' });
        }
      });

      await expect(aptService.updatePackage('nonexistent-package')).rejects.toThrow('Update failed');
    });
  });

  describe('upgradeAll', () => {
    it('should upgrade all packages successfully', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:upgrade' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      const onProgress = jest.fn();
      await aptService.upgradeAll(onProgress);
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle upgrade errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:upgrade' && callback) {
          callback({ success: false, error: 'Upgrade failed' });
        }
      });

      await expect(aptService.upgradeAll()).rejects.toThrow('Upgrade failed');
    });
  });

  describe('updateCache', () => {
    it('should update cache successfully', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:update' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      await aptService.updateCache();
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle cache update errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:update' && callback) {
          callback({ success: false, error: 'Cache update failed' });
        }
      });

      await expect(aptService.updateCache()).rejects.toThrow('Cache update failed');
    });
  });

  describe('cleanCache', () => {
    it('should clean cache successfully', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:clean' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      await aptService.cleanCache();
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle cache clean errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:clean' && callback) {
          callback({ success: false, error: 'Cache clean failed' });
        }
      });

      await expect(aptService.cleanCache()).rejects.toThrow('Cache clean failed');
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', async () => {
      const mockInfo: SystemInfo = {
        totalPackages: 1000,
        installedPackages: 200,
        upgradablePackages: 10,
        diskUsage: '5.2GB',
        lastUpdate: '2024-01-01T00:00:00Z',
      };
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:system-info' && callback) {
          callback({ info: mockInfo });
        }
      });

      const info = await aptService.getSystemInfo();
      
      expect(info).toEqual(mockInfo);
    });

    it('should return default system info when no data available', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:system-info' && callback) {
          callback({}); // No info
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

    it('should handle system info errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:system-info' && callback) {
          callback({ error: 'Failed to get system info' });
        }
      });

      await expect(aptService.getSystemInfo()).rejects.toThrow('Failed to get system info');
    });
  });

  describe('listUpgradable', () => {
    it('should return upgradable packages', async () => {
      const mockPackages: Package[] = [
        { name: 'nodejs', version: '18.0.0', description: 'Node.js runtime', size: '100MB', installed: true, upgradable: true },
        { name: 'nginx', version: '1.25.0', description: 'Web server', size: '50MB', installed: true, upgradable: true },
      ];
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:list-upgradable' && callback) {
          callback({ packages: mockPackages });
        }
      });

      const packages = await aptService.listUpgradable();
      
      expect(packages).toEqual(mockPackages);
    });

    it('should handle list upgradable errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:list-upgradable' && callback) {
          callback({ error: 'Failed to list upgradable packages' });
        }
      });

      await expect(aptService.listUpgradable()).rejects.toThrow('Failed to list upgradable packages');
    });
  });

  describe('autoremove', () => {
    it('should autoremove packages successfully', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:autoremove' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      await aptService.autoremove();
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle autoremove errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:autoremove' && callback) {
          callback({ success: false, error: 'Autoremove failed' });
        }
      });

      await expect(aptService.autoremove()).rejects.toThrow('Autoremove failed');
    });
  });

  describe('operation listeners', () => {
    it('should handle progress events for operations', async () => {
      const onProgress = jest.fn();
      
      // Mock the install to not complete immediately
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:install' && callback) {
          // Don't call callback immediately to keep operation active
        }
      });

      // Add listener
      aptService.installPackage('nodejs', onProgress);
      
      // Simulate progress event
      mockSocket.emit('apt:progress', {
        type: 'install',
        packageName: 'nodejs',
        progress: 75,
        status: 'Installing',
        output: ['Installing nodejs...'],
      });
      
      // Wait a bit for the event to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onProgress).toHaveBeenCalled();
    });

    it('should clean up listeners after operation completes', async () => {
      const onProgress = jest.fn();
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:install' && callback) {
          callback({ success: true });
        }
      });

      await aptService.installPackage('nodejs', onProgress);
      
      // Try to emit progress after completion - should not call callback
      const mockOperation: PackageOperation = {
        type: 'install',
        packageName: 'nodejs',
        progress: 100,
        status: 'Completed',
        output: ['Installation complete'],
      };
      
      mockSocket.emit('apt:progress', mockOperation);
      
      // Should only be called once during the operation
      expect(onProgress).toHaveBeenCalledTimes(0);
    });
  });
});