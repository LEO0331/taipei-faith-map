import { describe, expect, it } from 'vitest';
import { validatePublicEnvironment } from './validatePublicEnvironment';

describe('public build configuration boundary', () => {
  it('allows public optional settings and ignores server-only values', () => {
    expect(() => validatePublicEnvironment({ VITE_QUIET_PRESENCE_ENABLED: 'false', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_key', SUPABASE_SECRET_KEYS: '{"default":"server-only"}' })).not.toThrow();
  });
  it.each(['VITE_SUPABASE_SECRET_KEY', 'VITE_SERVICE_ROLE_KEY', 'VITE_DATABASE_PASSWORD'])('rejects privileged names without printing their value: %s', name => {
    try { validatePublicEnvironment({ [name]: 'do-not-print-this-value' }); throw new Error('Expected rejection'); }
    catch (error) { expect(String(error)).toContain('Privileged credentials'); expect(String(error)).not.toContain('do-not-print-this-value'); }
  });
  it('rejects secret keys mislabeled as publishable and privileged legacy JWTs', () => {
    expect(() => validatePublicEnvironment({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test_only' })).toThrow('Privileged credentials');
    const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
    expect(() => validatePublicEnvironment({ VITE_WRONGLY_NAMED_VALUE: `header.${payload}.signature` })).toThrow('Privileged credentials');
  });
});
