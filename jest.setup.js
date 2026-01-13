// Jest setup file
// This file runs before each test file

// Mock global fetch for testing
global.fetch = require('cross-fetch');

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (args[0] && args[0].includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    if (args[0] && args[0].includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});