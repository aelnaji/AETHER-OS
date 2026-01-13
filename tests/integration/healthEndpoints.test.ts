import { getHealthReport } from '@/lib/health/health';
import { getConfig } from '@/lib/config/config';

// Mock the config module
jest.mock('@/lib/config/config', () => ({
  getConfig: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Health Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealthReport', () => {
    it('should return healthy status when all checks pass', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      // Mock successful bytebot check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const report = await getHealthReport('health');

      expect(report.status).toBe('ok');
      expect(report.checks.resources.status).toBe('ok');
      expect(report.checks.bytebot.status).toBe('ok');
    });

    it('should return degraded status when non-critical checks fail', async () => {
      // Mock config with allowNoBytebot
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: true, // Bytebot failure is not critical
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      // Mock failed bytebot check
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const report = await getHealthReport('health');

      expect(report.status).toBe('degraded');
      expect(report.checks.bytebot.status).toBe('fail');
    });

    it('should return unhealthy status when critical checks fail', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100000, // Very high requirement to force failure
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('health');

      expect(report.status).toBe('unhealthy');
      expect(report.checks.resources.status).toBe('fail');
    });

    it('should skip bytebot check for liveness probe', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('liveness');

      expect(report.checks.bytebot.status).toBe('skipped');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should check database for readiness probe when configured', async () => {
      // Mock config with database
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://localhost:3001',
        databaseUrl: 'postgresql://localhost:5432/aether',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('readiness');

      expect(report.checks.database.status).not.toBe('skipped');
    });

    it('should handle bytebot endpoint timeout', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 10, // Very short timeout
        appVersion: '1.0.0',
      });

      // Mock slow response that times out
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true }), 100);
        });
      });

      const report = await getHealthReport('health');

      expect(report.checks.bytebot.status).toBe('fail');
      expect(report.checks.bytebot.error).toContain('timeout');
    });

    it('should handle bytebot endpoint connection errors', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://invalid-host:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      // Mock connection error
      mockFetch.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND invalid-host'));

      const report = await getHealthReport('health');

      expect(report.checks.bytebot.status).toBe('fail');
      expect(report.checks.bytebot.error).toContain('ENOTFOUND');
    });

    it('should handle bytebot endpoint HTTP errors', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      // Mock HTTP error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const report = await getHealthReport('health');

      expect(report.checks.bytebot.status).toBe('fail');
      expect(report.checks.bytebot.details?.httpStatus).toBe(500);
    });
  });

  describe('Resource Checks', () => {
    it('should check system resources correctly', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'development',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('health');

      expect(report.checks.resources).toBeDefined();
      expect(report.checks.resources.details).toHaveProperty('freeMemoryMb');
      expect(report.checks.resources.details).toHaveProperty('totalMemoryMb');
      expect(report.checks.resources.details).toHaveProperty('loadAvg1m');
    });

    it('should fail resource check when free memory is low', async () => {
      // Mock config with high memory requirement
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 1000000, // 1TB - should fail
        aetherEnv: 'production',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('health');

      expect(report.checks.resources.status).toBe('fail');
      expect(report.checks.resources.error).toContain('Low free memory');
    });
  });

  describe('Database Checks', () => {
    it('should check database connection for readiness', async () => {
      // Mock config with database
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        databaseUrl: 'postgresql://localhost:5432/aether',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('readiness');

      expect(report.checks.database.status).not.toBe('skipped');
    });

    it('should skip database check when no database configured', async () => {
      // Mock config without database
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('readiness');

      expect(report.checks.database.status).toBe('skipped');
    });

    it('should handle invalid database URL', async () => {
      // Mock config with invalid database URL
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        databaseUrl: 'invalid-url',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('readiness');

      expect(report.checks.database.status).toBe('fail');
      expect(report.checks.database.error).toContain('Invalid DATABASE_URL');
    });
  });

  describe('Performance and Timing', () => {
    it('should measure and report duration', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'development',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const start = Date.now();
      const report = await getHealthReport('health');
      const end = Date.now();

      expect(report.durationMs).toBeGreaterThanOrEqual(0);
      expect(report.durationMs).toBeLessThanOrEqual(end - start);
    });

    it('should handle slow bytebot endpoint gracefully', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'production',
        allowNoBytebot: false,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 100, // Short timeout
        appVersion: '1.0.0',
      });

      // Mock slow response
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true }), 200);
        });
      });

      const report = await getHealthReport('health');

      expect(report.durationMs).toBeLessThan(500); // Should not wait for full timeout
      expect(report.checks.bytebot.status).toBe('fail');
    });
  });

  describe('Report Structure and Metadata', () => {
    it('should include proper metadata in report', async () => {
      const mockConfig = {
        minFreeMemoryMb: 100,
        aetherEnv: 'staging',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '2.0.0-beta',
      };

      (getConfig as jest.Mock).mockReturnValue(mockConfig);

      const report = await getHealthReport('health');

      expect(report.version).toBe('2.0.0-beta');
      expect(report.environment).toBe('staging');
      expect(report.timestamp).toBeDefined();
      expect(new Date(report.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include all required check types', async () => {
      // Mock config
      (getConfig as jest.Mock).mockReturnValue({
        minFreeMemoryMb: 100,
        aetherEnv: 'development',
        allowNoBytebot: true,
        bytebotEndpoint: 'http://localhost:3001',
        healthcheckTimeoutMs: 5000,
        appVersion: '1.0.0',
      });

      const report = await getHealthReport('health');

      expect(report.checks).toHaveProperty('resources');
      expect(report.checks).toHaveProperty('bytebot');
      expect(report.checks).toHaveProperty('database');
    });
  });
});