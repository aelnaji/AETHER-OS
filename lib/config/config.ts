import { validateEnv } from '@/lib/config/validateEnv';

export function getConfig() {
  return validateEnv();
}
