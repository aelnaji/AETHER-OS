import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockSocket, createMockSocket } from '@/tests/utils/mocks';
import { ShellService } from '@/lib/services/shellService';
import { AptService } from '@/lib/services/aptService';
import { useTerminal } from '@/lib/hooks/useTerminal';

// Mock components for testing
const MockTerminal = ({ socket, onExecuteCommand }: any) => {
  const terminal = useTerminal({ socket });
  const [inputValue, setInputValue] = React.useState('');

  const handleExecute = () => {
    if (inputValue.trim()) {
      terminal.executeCommand(terminal.activeSessionId, inputValue);
      setInputValue('');
      onExecuteCommand?.(inputValue);
    }
  };

  return (
    <div>
      <div data-testid="terminal-sessions">
        {terminal.sessions.map(session => (
          <div key={session.id} data-testid={`session-${session.id}`}>
            <span>{session.title}</span>
            <div data-testid={`session-history-${session.id}`}>
              {session.history.map((cmd, idx) => (
                <div key={idx}>
                  <span data-testid="command">{cmd.command}</span>
                  <div data-testid="output">{cmd.output.join(' ')}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div data-testid="terminal-input">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
        />
        <button onClick={handleExecute}>Execute</button>
      </div>
      <div data-testid="connection-status">
        {terminal.activeSession?.isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

const MockPackageManager = ({ socket, onInstallPackage }: any) => {
  const [packages, setPackages] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [aptService] = React.useState(() => new AptService(socket));

  React.useEffect(() => {
    const loadPackages = async () => {
      try {
        const installed = await aptService.listInstalledPackages();
        setPackages(installed);
      } catch (error) {
        console.error('Failed to load packages:', error);
      }
    };
    loadPackages();
  }, [aptService]);

  const handleInstall = async (packageName: string) => {
    try {
      await aptService.installPackage(packageName);
      onInstallPackage?.(packageName);
    } catch (error) {
      console.error('Failed to install package:', error);
    }
  };

  const filteredPackages = packages.filter((pkg: any) => 
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div data-testid="search-input">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search packages..."
        />
      </div>
      <div data-testid="packages-list">
        {filteredPackages.map((pkg: any) => (
          <div key={pkg.name} data-testid={`package-${pkg.name}`}>
            <span>{pkg.name}</span>
            <span>{pkg.version}</span>
            <button onClick={() => handleInstall(pkg.name)}>Install</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MockSystemMonitor = ({ socket, onStatsUpdate }: any) => {
  const [systemInfo, setSystemInfo] = React.useState<any>(null);
  const [aptService] = React.useState(() => new AptService(socket));

  React.useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const info = await aptService.getSystemInfo();
        setSystemInfo(info);
        onStatsUpdate?.(info);
      } catch (error) {
        console.error('Failed to load system info:', error);
      }
    };
    loadSystemInfo();
  }, [aptService, onStatsUpdate]);

  return (
    <div>
      <div data-testid="system-stats">
        {systemInfo && (
          <>
            <div data-testid="total-packages">{systemInfo.totalPackages}</div>
            <div data-testid="installed-packages">{systemInfo.installedPackages}</div>
            <div data-testid="disk-usage">{systemInfo.diskUsage}</div>
          </>
        )}
      </div>
    </div>
  );
};

const MockProcessManager = ({ socket, onProcessAction }: any) => {
  const [processes, setProcesses] = React.useState([]);
  const [shellService] = React.useState(() => new ShellService(socket));
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const loadProcesses = async () => {
      try {
        const runningProcesses = await shellService.getRunningProcesses();
        setProcesses(runningProcesses);
      } catch (error) {
        console.error('Failed to load processes:', error);
      }
    };
    loadProcesses();
  }, [shellService]);

  const handleKillProcess = async (pid: number) => {
    try {
      await shellService.killProcess(pid);
      onProcessAction?.('kill', pid);
      // Refresh processes
      const updatedProcesses = await shellService.getRunningProcesses();
      setProcesses(updatedProcesses);
    } catch (error) {
      console.error('Failed to kill process:', error);
    }
  };

  const filteredProcesses = processes.filter((proc: any) => 
    proc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div data-testid="search-input">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search processes..."
        />
      </div>
      <div data-testid="processes-list">
        {filteredProcesses.map((proc: any) => (
          <div key={proc.pid} data-testid={`process-${proc.pid}`}>
            <span>{proc.name}</span>
            <span>PID: {proc.pid}</span>
            <span>CPU: {proc.cpu}%</span>
            <button onClick={() => handleKillProcess(proc.pid)}>Kill</button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Component Integration Tests', () => {
  let mockSocket: MockSocket;

  beforeEach(() => {
    mockSocket = createMockSocket();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Terminal Component Integration', () => {
    it('should render terminal with initial state', () => {
      render(<MockTerminal socket={mockSocket} />);

      expect(screen.getByTestId('terminal-sessions')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-input')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should handle command execution', async () => {
      const user = userEvent.setup();
      const onExecuteCommand = jest.fn();

      render(<MockTerminal socket={mockSocket} onExecuteCommand={onExecuteCommand} />);

      const input = screen.getByRole('textbox');
      const executeButton = screen.getByRole('button', { name: /execute/i });

      await user.type(input, 'echo "Hello World"');
      await user.click(executeButton);

      await waitFor(() => {
        expect(onExecuteCommand).toHaveBeenCalledWith('echo "Hello World"');
      });

      // Wait for command to appear in history
      await waitFor(() => {
        expect(screen.getByText('echo "Hello World"')).toBeInTheDocument();
      });
    });

    it('should handle keyboard input (Enter key)', async () => {
      const user = userEvent.setup();

      render(<MockTerminal socket={mockSocket} />);

      const input = screen.getByRole('textbox');

      await user.type(input, 'ls -la{enter}');

      await waitFor(() => {
        expect(screen.getByText('ls -la')).toBeInTheDocument();
      });
    });

    it('should display connection status correctly', async () => {
      mockSocket.connected = false;
      
      render(<MockTerminal socket={mockSocket} />);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();

      // Simulate connection
      mockSocket.connected = true;
      act(() => {
        mockSocket.emit('connect');
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('should handle command execution in disconnected state', async () => {
      const user = userEvent.setup();
      mockSocket.connected = false;

      render(<MockTerminal socket={mockSocket} />);

      const input = screen.getByRole('textbox');
      const executeButton = screen.getByRole('button', { name: /execute/i });

      await user.type(input, 'echo "test"');
      await user.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText('Not connected to backend')).toBeInTheDocument();
      });
    });

    it('should display command output correctly', async () => {
      const user = userEvent.setup();

      render(<MockTerminal socket={mockSocket} />);

      const input = screen.getByRole('textbox');
      const executeButton = screen.getByRole('button', { name: /execute/i });

      await user.type(input, 'echo "test output"');
      await user.click(executeButton);

      await waitFor(() => {
        const outputElements = screen.getAllByText(/Mock terminal output/);
        expect(outputElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should handle empty input gracefully', async () => {
      const user = userEvent.setup();

      render(<MockTerminal socket={mockSocket} />);

      const input = screen.getByRole('textbox');
      const executeButton = screen.getByRole('button', { name: /execute/i });

      // Try to execute with empty input
      await user.click(executeButton);

      // Should not execute any commands
      await waitFor(() => {
        const commands = screen.queryAllByTestId('command');
        expect(commands).toHaveLength(0);
      });
    });

    it('should handle whitespace-only input', async () => {
      const user = userEvent.setup();

      render(<MockTerminal socket={mockSocket} />);

      const input = screen.getByRole('textbox');
      const executeButton = screen.getByRole('button', { name: /execute/i });

      await user.type(input, '   ');
      await user.click(executeButton);

      // Should not execute commands with only whitespace
      await waitFor(() => {
        const commands = screen.queryAllByTestId('command');
        expect(commands).toHaveLength(0);
      });
    });
  });

  describe('Package Manager Component Integration', () => {
    it('should render package manager interface', async () => {
      render(<MockPackageManager socket={mockSocket} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('packages-list')).toBeInTheDocument();
    });

    it('should display packages after loading', async () => {
      render(<MockPackageManager socket={mockSocket} />);

      await waitFor(() => {
        const packageElements = screen.getAllByTestId(/package-/);
        expect(packageElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should handle package search', async () => {
      const user = userEvent.setup();

      render(<MockPackageManager socket={mockSocket} />);

      await waitFor(() => {
        expect(screen.getByTestId('packages-list')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search packages...');
      await user.type(searchInput, 'node');

      await waitFor(() => {
        const packageElements = screen.getAllByTestId(/package-/);
        // Should show only node-related packages
        packageElements.forEach(el => {
          expect(el.textContent?.toLowerCase()).toContain('node');
        });
      });
    });

    it('should handle package installation', async () => {
      const user = userEvent.setup();
      const onInstallPackage = jest.fn();

      render(<MockPackageManager socket={mockSocket} onInstallPackage={onInstallPackage} />);

      await waitFor(() => {
        const installButtons = screen.getAllByRole('button', { name: /install/i });
        expect(installButtons.length).toBeGreaterThan(0);
      });

      const installButton = screen.getAllByRole('button', { name: /install/i })[0];
      await user.click(installButton);

      await waitFor(() => {
        expect(onInstallPackage).toHaveBeenCalled();
      });
    });

    it('should handle installation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock socket to return error for installation
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'apt:install') {
          setTimeout(() => callback({ success: false, error: 'Package not found' }), 100);
        } else {
          // Call original implementation for other events
          MockSocket.prototype.emit.call(mockSocket, event, ...Array.from(arguments).slice(2));
        }
      });

      render(<MockPackageManager socket={mockSocket} />);

      await waitFor(() => {
        const installButtons = screen.getAllByRole('button', { name: /install/i });
        expect(installButtons.length).toBeGreaterThan(0);
      });

      const installButton = screen.getAllByRole('button', { name: /install/i })[0];
      await user.click(installButton);

      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByTestId('packages-list')).toBeInTheDocument();
      });
    });

    it('should display package information correctly', async () => {
      render(<MockPackageManager socket={mockSocket} />);

      await waitFor(() => {
        const packageElements = screen.getAllByTestId(/package-/);
        expect(packageElements.length).toBeGreaterThan(0);
      });

      packageElements.forEach(packageEl => {
        expect(packageEl).toHaveTextContent(/\w+/); // Should have name
        expect(packageEl).toHaveTextContent(/\d+\.\d+\.\d+/); // Should have version
      });
    });
  });

  describe('System Monitor Component Integration', () => {
    it('should render system monitor interface', () => {
      render(<MockSystemMonitor socket={mockSocket} />);

      expect(screen.getByTestId('system-stats')).toBeInTheDocument();
    });

    it('should display system information after loading', async () => {
      render(<MockSystemMonitor socket={mockSocket} />);

      await waitFor(() => {
        expect(screen.getByTestId('total-packages')).toBeInTheDocument();
        expect(screen.getByTestId('installed-packages')).toBeInTheDocument();
        expect(screen.getByTestId('disk-usage')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should update system stats when data changes', async () => {
      const onStatsUpdate = jest.fn();

      render(<MockSystemMonitor socket={mockSocket} onStatsUpdate={onStatsUpdate} />);

      await waitFor(() => {
        expect(onStatsUpdate).toHaveBeenCalledWith(expect.objectContaining({
          totalPackages: expect.any(Number),
          installedPackages: expect.any(Number),
          diskUsage: expect.any(String)
        }));
      });
    });

    it('should handle loading states', async () => {
      // Mock slower response
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'apt:system-info') {
          setTimeout(() => callback({
            info: {
              totalPackages: 1000,
              installedPackages: 500,
              upgradablePackages: 10,
              diskUsage: '2.5 GB',
              lastUpdate: '2024-01-15 10:00:00'
            }
          }), 500);
        } else {
          // Call original implementation
          MockSocket.prototype.emit.call(mockSocket, event, ...Array.from(arguments).slice(2));
        }
      });

      render(<MockSystemMonitor socket={mockSocket} />);

      // Initially should show loading state (if implemented)
      expect(screen.getByTestId('system-stats')).toBeInTheDocument();

      // Should eventually load data
      await waitFor(() => {
        expect(screen.getByTestId('total-packages')).toHaveTextContent('1000');
      }, { timeout: 1000 });
    });

    it('should handle system info errors gracefully', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'apt:system-info') {
          callback({ error: 'System info unavailable' });
        } else {
          MockSocket.prototype.emit.call(mockSocket, event, ...Array.from(arguments).slice(2));
        }
      });

      render(<MockSystemMonitor socket={mockSocket} />);

      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByTestId('system-stats')).toBeInTheDocument();
      });
    });
  });

  describe('Process Manager Component Integration', () => {
    it('should render process manager interface', () => {
      render(<MockProcessManager socket={mockSocket} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('processes-list')).toBeInTheDocument();
    });

    it('should display processes after loading', async () => {
      render(<MockProcessManager socket={mockSocket} />);

      await waitFor(() => {
        const processElements = screen.getAllByTestId(/process-/);
        expect(processElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should handle process search', async () => {
      const user = userEvent.setup();

      render(<MockProcessManager socket={mockSocket} />);

      await waitFor(() => {
        expect(screen.getByTestId('processes-list')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search processes...');
      await user.type(searchInput, 'node');

      await waitFor(() => {
        const processElements = screen.getAllByTestId(/process-/);
        // Should filter to show only node processes
        processElements.forEach(el => {
          expect(el.textContent?.toLowerCase()).toContain('node');
        });
      });
    });

    it('should handle process killing', async () => {
      const user = userEvent.setup();
      const onProcessAction = jest.fn();

      render(<MockProcessManager socket={mockSocket} onProcessAction={onProcessAction} />);

      await waitFor(() => {
        const killButtons = screen.getAllByRole('button', { name: /kill/i });
        expect(killButtons.length).toBeGreaterThan(0);
      });

      const killButton = screen.getAllByRole('button', { name: /kill/i })[0];
      await user.click(killButton);

      await waitFor(() => {
        expect(onProcessAction).toHaveBeenCalledWith('kill', expect.any(Number));
      });
    });

    it('should display process information correctly', async () => {
      render(<MockProcessManager socket={mockSocket} />);

      await waitFor(() => {
        const processElements = screen.getAllByTestId(/process-/);
        expect(processElements.length).toBeGreaterThan(0);
      });

      processElements.forEach(processEl => {
        expect(processEl).toHaveTextContent(/\w+/); // Process name
        expect(processEl).toHaveTextContent(/PID:/); // PID label
        expect(processEl).toHaveTextContent(/CPU:/); // CPU label
        expect(processEl).toHaveTextContent(/\d+/); // PID number
      });
    });

    it('should handle process kill errors', async () => {
      const user = userEvent.setup();
      
      // Mock socket to return error for kill operation
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:kill') {
          setTimeout(() => callback({ success: false, error: 'Permission denied' }), 100);
        } else {
          MockSocket.prototype.emit.call(mockSocket, event, ...Array.from(arguments).slice(2));
        }
      });

      render(<MockProcessManager socket={mockSocket} />);

      await waitFor(() => {
        const killButtons = screen.getAllByRole('button', { name: /kill/i });
        expect(killButtons.length).toBeGreaterThan(0);
      });

      const killButton = screen.getAllByRole('button', { name: /kill/i })[0];
      await user.click(killButton);

      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByTestId('processes-list')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Integration', () => {
    it('should handle data flow between components', async () => {
      const user = userEvent.setup();

      // Render multiple components
      const { rerender } = render(
        <div>
          <MockTerminal socket={mockSocket} />
          <MockPackageManager socket={mockSocket} />
          <MockSystemMonitor socket={mockSocket} />
          <MockProcessManager socket={mockSocket} />
        </div>
      );

      // Wait for all components to load
      await waitFor(() => {
        expect(screen.getByTestId('terminal-sessions')).toBeInTheDocument();
        expect(screen.getByTestId('packages-list')).toBeInTheDocument();
        expect(screen.getByTestId('system-stats')).toBeInTheDocument();
        expect(screen.getByTestId('processes-list')).toBeInTheDocument();
      });

      // All components should render without conflicts
      expect(screen.getAllByText('Connected')).toHaveLength(1);
    });

    it('should handle socket disconnection across all components', async () => {
      mockSocket.connected = false;

      render(
        <div>
          <MockTerminal socket={mockSocket} />
          <MockPackageManager socket={mockSocket} />
          <MockSystemMonitor socket={mockSocket} />
          <MockProcessManager socket={mockSocket} />
        </div>
      );

      expect(screen.getByText('Disconnected')).toBeInTheDocument();

      // Reconnect
      mockSocket.connected = true;
      act(() => {
        mockSocket.emit('connect');
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();

      render(<MockTerminal socket={mockSocket} />);

      const input = screen.getByRole('textbox');

      // Rapid typing
      for (let i = 0; i < 5; i++) {
        await user.type(input, `command${i}{enter}`);
        await waitFor(() => {
          expect(screen.getAllByText(`command${i}`).length).toBeGreaterThan(0);
        });
      }

      // Should handle all commands
      for (let i = 0; i < 5; i++) {
        expect(screen.getByText(`command${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('Component Error Handling', () => {
    it('should handle component unmounting during async operations', async () => {
      const user = userEvent.setup();

      const { unmount } = render(<MockPackageManager socket={mockSocket} />);

      // Start a search operation
      const searchInput = screen.getByPlaceholderText('Search packages...');
      await user.type(searchInput, 'node');

      // Unmount while operation is in progress
      unmount();

      // Should not cause memory leaks or errors
      expect(() => {
        // Attempt to interact after unmount
        fireEvent.change(searchInput, { target: { value: 'test' } });
      }).not.toThrow();
    });

    it('should handle malformed data gracefully', async () => {
      // Mock socket to return malformed data
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'apt:list-installed') {
          callback({ packages: null }); // Malformed data
        } else if (event === 'shell:ps') {
          callback({ processes: undefined }); // Malformed data
        } else {
          MockSocket.prototype.emit.call(mockSocket, event, ...Array.from(arguments).slice(2));
        }
      });

      render(
        <div>
          <MockPackageManager socket={mockSocket} />
          <MockProcessManager socket={mockSocket} />
        </div>
      );

      // Should handle malformed data without crashing
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock slow responses
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        setTimeout(() => {
          if (event === 'apt:list-installed') {
            callback({ packages: [] });
          } else if (event === 'shell:ps') {
            callback({ processes: [] });
          } else if (event === 'apt:system-info') {
            callback({ info: {} });
          }
        }, 2000);
      });

      render(
        <div>
          <MockPackageManager socket={mockSocket} />
          <MockSystemMonitor socket={mockSocket} />
          <MockProcessManager socket={mockSocket} />
        </div>
      );

      // Should eventually render (even with slow responses)
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Component Performance', () => {
    it('should render efficiently with large datasets', async () => {
      // Mock socket to return large datasets
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'apt:list-installed') {
          callback({ packages: Array.from({ length: 1000 }, (_, i) => ({
            name: `package-${i}`,
            version: '1.0.0',
            description: 'Test package',
            size: '1MB',
            installed: true,
            upgradable: false
          })) });
        } else {
          MockSocket.prototype.emit.call(mockSocket, event, ...Array.from(arguments).slice(2));
        }
      });

      const start = performance.now();
      render(<MockPackageManager socket={mockSocket} />);
      const renderTime = performance.now() - start;

      await waitFor(() => {
        const packageElements = screen.getAllByTestId(/package-/);
        expect(packageElements.length).toBeGreaterThan(0);
      });

      // Should render efficiently (within reasonable time)
      expect(renderTime).toBeLessThan(1000); // 1 second
    });

    it('should handle rapid state updates efficiently', async () => {
      const user = userEvent.setup();

      render(<MockTerminal socket={mockSocket} />);

      const input = screen.getByRole('textbox');
      const executeButton = screen.getByRole('button', { name: /execute/i });

      const start = performance.now();

      // Rapid command execution
      for (let i = 0; i < 10; i++) {
        await user.type(input, `rapid-command-${i}`);
        await user.click(executeButton);
        await user.clear(input);
      }

      const totalTime = performance.now() - start;

      // Should handle rapid updates efficiently
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 10 commands

      // Should render all commands
      for (let i = 0; i < 10; i++) {
        expect(screen.getByText(`rapid-command-${i}`)).toBeInTheDocument();
      }
    });
  });
});