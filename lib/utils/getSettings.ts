import { cookies } from 'next/headers';
import { LLMSettings } from '@/lib/types/settings';

export function getSettingsFromCookies(): LLMSettings {
  const cookieStore = cookies();
  const settingsCookie = cookieStore.get('aether-settings');
  
  if (settingsCookie) {
    try {
      const parsed = JSON.parse(settingsCookie.value);
      return parsed.state.llmSettings;
    } catch (error) {
      console.error('Failed to parse settings cookie:', error);
    }
  }
  
  // Return defaults
  return {
    endpoint: 'https://integrate.api.nvidia.com/v1',
    apiKey: '',
    model: 'meta/llama-3.1-405b-instruct',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: `You are A.E (AETHER ENGINE), an autonomous AI agent integrated into AETHER-OS running on a local Docker environment. You can control the desktop, execute code, manage files, and accomplish real tasks. You have access to:
- Terminal/shell commands
- File system operations (read, write, create, delete)
- Application launching and management
- Code execution (Python, Node.js, Bash)
- Git operations

Be conversational, helpful, and always explain what you're doing before executing tools.`
  };
}