# AETHER-OS Testing Guide

This document provides comprehensive guidance for testing the AETHER-OS application, including setup, execution, and best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Mock Backend](#mock-backend)
6. [Debugging](#debugging)
7. [Performance Testing](#performance-testing)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

Ensure you have the required dependencies installed:

```bash
npm install
```

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (for pipelines)
npm run test:ci
```

## Test Structure

The test suite is organized into the following structure:

```
tests/
├── services/           # Service layer unit tests
│   ├── shellService.test.ts
│   └── aptService.test.ts
├── hooks/             # React hooks unit tests
│   └── useTerminal.test.ts
├── integration/        # Integration tests
│   ├── socket-io.test.ts
│   └── components.test.ts
└── utils/             # Test utilities and mocks
    ├── mocks.ts
    └── test-helpers.ts
```

### Test Types

#### Unit Tests (`tests/services/`, `tests/hooks/`)
- **Purpose**: Test individual functions, classes, and React hooks in isolation
- **Dependencies**: Mocked external dependencies
- **Coverage Target**: 80%+ for service and hook files
- **Examples**: 
  - Testing `ShellService.execute()` method
  - Testing `useTerminal` hook behavior
  - Testing `AptService` package operations

#### Integration Tests (`tests/integration/`)
- **Purpose**: Test how components and services work together
- **Dependencies**: Mock Socket.IO server for realistic testing
- **Focus**: End-to-end data flow and communication patterns
- **Examples**:
  - Terminal command execution through Socket.IO
  - Package installation with progress tracking
  - Multi-component data synchronization

#### Mock Utilities (`tests/utils/`)
- **Purpose**: Provide testing infrastructure and utilities
- **Components**:
  - `MockSocket`: Full Socket.IO client simulation
  - Data factories for consistent test data
  - Performance measurement utilities
  - Error simulation helpers

## Running Tests

### Available Test Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:ci": "jest --coverage --ci"
}
```

### Test Execution Options

#### Run Specific Test Files
```bash
# Run only shell service tests
npm test -- tests/services/shellService.test.ts

# Run only terminal hook tests
npm test -- tests/hooks/useTerminal.test.ts

# Run only integration tests
npm test -- tests/integration/
```

#### Run Tests by Pattern
```bash
# Run tests matching a pattern
npm test -- --testNamePattern="should execute command"

# Run tests with specific tags
npm test -- --testPathPattern="integration"
```

#### Debug Tests
```bash
# Run tests with Node.js debugger
npm test -- --inspect-brk

# Run specific test in debug mode
npm test -- tests/services/shellService.test.ts --inspect-brk
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Writing Tests

### Service Test Template

```typescript
import { ServiceClass } from '@/lib/services/serviceClass';
import { MockSocket, createMockSocket } from '@/tests/utils/mocks';
import { createTestData, waitFor, setupTestEnvironment } from '@/tests/utils/test-helpers';

describe('ServiceClass', () => {
  let service: ServiceClass;
  let mockSocket: MockSocket;
  let testEnv: any;

  beforeEach(() => {
    mockSocket = createMockSocket();
    service = new ServiceClass(mockSocket);
    testEnv = setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('methodName', () => {
    it('should handle success scenario', async () => {
      const result = await service.methodName('test-input');
      
      expect(result).toBeDefined();
      expect(mockSocket.emit).toHaveBeenCalledWith('expected:event', expect.any(Object));
    });

    it('should handle error scenarios', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'expected:event') {
          callback({ error: 'Test error' });
        }
      });

      await expect(service.methodName('test-input')).rejects.toThrow('Test error');
    });

    it('should handle edge cases', () => {
      // Test edge cases, null inputs, etc.
    });
  });
});
```

### Hook Test Template

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomHook } from '@/lib/hooks/useCustomHook';
import { MockSocket, createMockSocket } from '@/tests/utils/mocks';

describe('useCustomHook', () => {
  let mockSocket: MockSocket;

  beforeEach(() => {
    mockSocket = createMockSocket();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCustomHook());

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle state updates', async () => {
    const { result } = renderHook(() => useCustomHook({ socket: mockSocket }));

    act(() => {
      result.current.updateData('new-data');
    });

    expect(result.current.data).toContain('new-data');
  });

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useCustomHook({ socket: mockSocket }));

    act(() => {
      result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
  });
});
```

### Integration Test Template

```typescript
import { ServiceA } from '@/lib/services/serviceA';
import { ServiceB } from '@/lib/services/serviceB';
import { MockSocket, createMockSocket } from '@/tests/utils/mocks';

describe('Service Integration', () => {
  let mockSocket: MockSocket;
  let serviceA: ServiceA;
  let serviceB: ServiceB;

  beforeEach(() => {
    mockSocket = createMockSocket();
    serviceA = new ServiceA(mockSocket);
    serviceB = new ServiceB(mockSocket);
  });

  it('should coordinate between services', async () => {
    // Set up service interaction
    const promiseA = serviceA.operationA();
    const promiseB = serviceB.operationB();

    const [resultA, resultB] = await Promise.all([promiseA, promiseB]);

    // Verify cross-service communication
    expect(resultA).toBeDefined();
    expect(resultB).toBeDefined();
    expect(mockSocket.emit).toHaveBeenCalledTimes(2);
  });
});
```

## Mock Backend

### Using MockSocket

The `MockSocket` class provides comprehensive Socket.IO client simulation:

```typescript
import { MockSocket, createMockSocket } from '@/tests/utils/mocks';

// Basic usage
const mockSocket = createMockSocket();

// Custom responses
const customSocket = createSocketWithCustomResponses({
  'shell:execute': { type: 'stdout', content: 'custom response' },
  'apt:install': { success: true }
});

// Disconnected socket
const disconnectedSocket = createDisconnectedSocket();
```

### Customizing Mock Responses

```typescript
// Override specific events
mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
  if (event === 'custom:event') {
    callback({ custom: 'response' });
  } else {
    // Use default mock implementation
    MockSocket.prototype.emit.call(mockSocket, event, ...arguments);
  }
});

// Simulate network errors
mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
  if (event === 'network:operation') {
    setTimeout(() => callback({ error: 'Network error' }), 100);
  }
});
```

### Simulating Progress Events

```typescript
// Simulate progress events for long operations
const simulateProgress = (socket: MockSocket, type: string, packageName: string) => {
  const progressSteps = [10, 25, 50, 75, 100];
  
  progressSteps.forEach((progress, index) => {
    setTimeout(() => {
      socket.emit('apt:progress', {
        type,
        packageName,
        progress,
        status: `Progress: ${progress}%`,
        output: [`Step ${index + 1} of ${progressSteps.length}`]
      });
    }, index * 100);
  });
};
```

## Debugging

### Common Test Issues

#### 1. Flaky Tests
```typescript
// Use proper async/await patterns
it('should handle async operations', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

// Use waitFor for React state updates
it('should update state', async () => {
  const { result } = renderHook(() => useHook());
  
  act(() => {
    result.current.updateState();
  });

  await waitFor(() => {
    expect(result.current.state).toBe('updated');
  });
});
```

#### 2. Socket Event Issues
```typescript
// Ensure proper event listener cleanup
afterEach(() => {
  jest.clearAllMocks();
  mockSocket.removeAllListeners();
});

// Verify event emissions
it('should emit correct events', async () => {
  await service.method();
  
  expect(mockSocket.emit).toHaveBeenCalledWith('expected:event', {
    expected: 'data'
  });
});
```

#### 3. Memory Leaks
```typescript
// Clean up in afterEach
afterEach(() => {
  jest.restoreAllMocks();
  mockSocket.removeAllListeners();
});

// Test component unmounting
it('should cleanup on unmount', () => {
  const { unmount } = render(<Component />);
  unmount();
  // Verify no memory leaks
});
```

### Debug Mode

```bash
# Run tests with Node.js inspector
npm test -- --inspect-brk

# Run with verbose output
npm test -- --verbose

# Run specific failing test
npm test -- --testNamePattern="failing test name"
```

### Test Output Analysis

```bash
# Generate detailed coverage report
npm run test:coverage -- --coverage --coverageReporters=html,lcov

# Run tests with console output
npm test -- --verbose --no-coverage

# Run tests and show diff on failure
npm test -- --verbose --no-coverage --bail
```

## Performance Testing

### Built-in Performance Utilities

```typescript
import { measureExecutionTime, assertPerformance } from '@/tests/utils/test-helpers';

it('should complete within performance threshold', async () => {
  const { result, duration } = await measureExecutionTime(
    () => service.expensiveOperation()
  );
  
  assertPerformance(duration, 1000); // Should complete within 1 second
  expect(result).toBeDefined();
});
```

### Performance Test Patterns

```typescript
it('should handle large datasets efficiently', async () => {
  const largeDataset = Array.from({ length: 10000 }, (_, i) => `item-${i}`);
  
  const start = performance.now();
  const result = await service.processLargeDataset(largeDataset);
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(2000); // 2 second threshold
  expect(result.length).toBe(largeDataset.length);
});

it('should handle concurrent operations', async () => {
  const operations = Array.from({ length: 100 }, (_, i) => 
    service.concurrentOperation(`data-${i}`)
  );
  
  const start = performance.now();
  const results = await Promise.all(operations);
  const duration = performance.now() - start;
  
  expect(results.length).toBe(100);
  expect(duration).toBeLessThan(5000); // 5 second threshold for 100 operations
});
```

## CI/CD Integration

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline (`.github/workflows/test.yml`) that:

1. **Tests on Multiple Node.js Versions**: 18.x and 20.x
2. **Runs All Test Suites**: Unit, integration, and coverage
3. **Validates Code Quality**: Linting and type checking
4. **Generates Coverage Reports**: Upload to Codecov
5. **Build Verification**: Ensures Next.js build succeeds

### Local CI Simulation

```bash
# Simulate CI environment locally
npm run lint
npm run test:ci
npm run build
npx tsc --noEmit
```

### Coverage Thresholds

The project enforces the following coverage thresholds:

- **Global**: 70% minimum
- **Services** (`lib/services/`): 80% minimum
- **Hooks** (`lib/hooks/`): 80% minimum

Coverage reports are available in `coverage/lcov-report/index.html`.

## Troubleshooting

### Common Issues and Solutions

#### 1. Test Timeouts
```typescript
// Increase timeout for slow operations
jest.setTimeout(30000); // 30 seconds

// Or per-test timeout
it('should handle slow operation', async () => {
  const result = await service.slowOperation();
  expect(result).toBeDefined();
}, 30000);
```

#### 2. Socket Connection Issues
```typescript
// Ensure proper socket initialization
beforeEach(() => {
  mockSocket = createMockSocket();
  service = new Service(mockSocket);
  
  // Reset connection state
  mockSocket.connected = true;
});
```

#### 3. React Hook Testing Issues
```typescript
// Use act() for state updates
act(() => {
  result.current.updateState();
});

// Use waitFor for async state changes
await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

#### 4. Memory Issues in Tests
```typescript
// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  if (mockSocket) {
    mockSocket.removeAllListeners();
  }
});
```

### Getting Help

1. **Check Test Output**: Look for detailed error messages and stack traces
2. **Review Coverage Reports**: Identify untested code paths
3. **Use Debug Mode**: Run specific tests with `--inspect-brk`
4. **Check Mock Implementation**: Verify `MockSocket` behavior in `tests/utils/mocks.ts`

### Best Practices

1. **Test Naming**: Use descriptive test names that explain the scenario
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Always mock Socket.IO and other external services
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Clean Up**: Always clean up after tests to prevent interference
6. **Performance**: Include performance tests for critical operations
7. **Documentation**: Keep tests well-documented for future maintenance

### Contributing New Tests

When adding new tests:

1. **Follow the established structure** in `tests/services/`, `tests/hooks/`, or `tests/integration/`
2. **Use the provided utilities** from `tests/utils/test-helpers.ts`
3. **Mock external dependencies** using `MockSocket` and related utilities
4. **Include both success and failure scenarios**
5. **Add performance considerations** for operations that might be slow
6. **Update this documentation** if adding new test patterns or utilities

For questions or issues with testing, refer to the existing test implementations for examples and patterns.