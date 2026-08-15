import type { Role } from '@/types/admin';

/**
 * Where a role lands. One definition, used by the entry screen and by every
 * role switcher - otherwise "switch to member" and "pick member" can drift
 * into sending you to different places.
 */
export function homeForRole(role: Role, onboarded: boolean): string {
  if (role !== 'member') return '/(tabs)/admin';
  return onboarded ? '/(tabs)' : '/onboarding/goal';
}
