import { ShellService, CommandOutput } from '@/lib/services/shellService';
import { createMockSocket } from '@/tests/utils/mocks';
import { waitFor } from '@/tests/utils/test-helpers';

describe('ShellService Execute Method', () => {
  let shellService: ShellService;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = createMockSocket();
    shellService = new ShellService(mockSocket);
  });

  describe('execute', () => {
    it('should execute a basic command and yield outputs', async () => {
      const command = 'ls -la';
      const outputs: CommandOutput[] = [];

      const generator = shellService.execute(command);
      
      // Collect all outputs
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs).toHaveLength(2); // stdout + exit
      expect(outputs[0]).toHaveProperty('type', 'stdout');
      expect(outputs[0]).toHaveProperty('content');
      expect(outputs[1]).toHaveProperty('type', 'exit');
      expect(outputs[1]).toHaveProperty('exitCode', 0);
    });

    it('should execute command with options', async () => {
      const command = 'echo "test"';
      const options = {
        timeout: 5000,
        interactive: true,
        shell: 'bash',
        environment: { TEST: 'value' },
        cwd: '/home/test'
      };

      const generator = shellService.execute(command, options);
      const outputs: CommandOutput[] = [];

      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs.length).toBeGreaterThan(0);
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:execute', {
        command,
        shell: 'bash',
        environment: { TEST: 'value' },
        cwd: '/home/test',
        interactive: true
      });
    });

    it('should handle command execution timeout', async () => {
      const command = 'sleep 10';
      const options = { timeout: 100 };

      const generator = shellService.execute(command, options);
      
      await expect(async () => {
        for await (const output of generator) {
          // This should timeout
        }
      }).rejects.toThrow('Command execution timeout');
    }, 500); // 500ms timeout for this test

    it('should handle command execution with errors', async () => {
      const command = 'invalid-command';
      const outputs: CommandOutput[] = [];

      const generator = shellService.execute(command);
      
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs).toHaveLength(2);
      expect(outputs[0]).toHaveProperty('type', 'stderr');
      expect(outputs[1]).toHaveProperty('exitCode', 1);
    });

    it('should use default options when not provided', async () => {
      const command = 'pwd';
      const outputs: CommandOutput[] = [];

      const generator = shellService.execute(command);
      
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs.length).toBeGreaterThan(0);
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:execute', {
        command,
        shell: 'bash',
        environment: {},
        cwd: undefined,
        interactive: false
      });
    });

    it('should handle multiple sequential commands', async () => {
      const commands = ['echo "test1"', 'echo "test2"', 'echo "test3"'];
      const allOutputs: CommandOutput[][] = [];

      for (const command of commands) {
        const generator = shellService.execute(command);
        const outputs: CommandOutput[] = [];
        
        for await (const output of generator) {
          outputs.push(output);
        }
        
        allOutputs.push(outputs);
      }

      expect(allOutputs).toHaveLength(3);
      allOutputs.forEach(outputs => {
        expect(outputs).toHaveLength(2);
        expect(outputs[1]).toHaveProperty('exitCode', 0);
      });
    });

    it('should handle concurrent command execution', async () => {
      const commands = ['ls', 'pwd', 'whoami'];
      
      const generators = commands.map(command => shellService.execute(command));
      const allOutputs = await Promise.all(
        generators.map(async generator => {
          const outputs: CommandOutput[] = [];
          for await (const output of generator) {
            outputs.push(output);
          }
          return outputs;
        })
      );

      expect(allOutputs).toHaveLength(3);
      allOutputs.forEach(outputs => {
        expect(outputs).toHaveLength(2);
      });
    });
  });
});