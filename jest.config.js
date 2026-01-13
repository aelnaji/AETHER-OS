const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files after environment
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Transform patterns
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/(app|components|lib)/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  
  // Coverage thresholds (temporarily lowered for initial setup)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
    './lib/services/': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './lib/hooks/': {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  
  // Coverage report formats
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);