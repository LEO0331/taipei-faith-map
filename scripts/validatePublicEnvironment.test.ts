import { describe, expect, it } from 'vitest';
import { validatePublicEnvironment } from './validatePublicEnvironment';

describe('public build configuration boundary', () => {
  const publicSettings = {
    VITE_SUPABASE_URL: 'https://controlled-project.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_key',
    VITE_SUPABASE_TURNSTILE_SITE_KEY: 'public_turnstile_site_key',
  };
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

  it('allows the static core without shared-service configuration', () => {
    expect(() => validatePublicEnvironment({ VITE_QUIET_PRESENCE_ENABLED: 'false', VITE_QUIET_CORNER_ENABLED: 'false' })).not.toThrow();
    expect(() => validatePublicEnvironment({ VITE_QUIET_PRESENCE_ENABLED: '1' })).not.toThrow();
  });

  it.each(['VITE_QUIET_PRESENCE_ENABLED', 'VITE_QUIET_CORNER_ENABLED'])('requires all public configuration when %s is enabled', feature => {
    expect(() => validatePublicEnvironment({ ...publicSettings, [feature]: 'true' })).not.toThrow();
    for (const name of Object.keys(publicSettings)) {
      const environment: Record<string, string | undefined> = { ...publicSettings, [feature]: 'true', [name]: '' };
      expect(() => validatePublicEnvironment(environment)).toThrow(`${name} is required`);
    }
  });

  it.each([
    'https://untrusted.example', 'http://controlled-project.supabase.co',
    'https://user:password@controlled-project.supabase.co', 'https://controlled-project.supabase.co/rest/v1',
    'https://controlled-project.supabase.co?apikey=private-test-value', ' https://controlled-project.supabase.co',
  ])('rejects invalid origins without echoing configuration: %s', url => {
    try { validatePublicEnvironment({ ...publicSettings, VITE_QUIET_PRESENCE_ENABLED: 'true', VITE_SUPABASE_URL: url }); throw new Error('Expected rejection'); }
    catch (error) { expect(String(error)).toContain('VITE_SUPABASE_URL'); expect(String(error)).not.toContain(url); expect(String(error)).not.toContain('private-test-value'); }
  });

  it('permits explicitly local controlled integration endpoints', () => {
    expect(() => validatePublicEnvironment({ ...publicSettings, VITE_QUIET_PRESENCE_ENABLED: 'true', VITE_SUPABASE_URL: 'http://127.0.0.1:54321' })).not.toThrow();
  });

  it.each(['short', 'a'.repeat(201), 'public key with spaces'])('rejects malformed public widget configuration', siteKey => {
    expect(() => validatePublicEnvironment({ ...publicSettings, VITE_QUIET_CORNER_ENABLED: 'true', VITE_SUPABASE_TURNSTILE_SITE_KEY: siteKey })).toThrow('public Turnstile site key');
  });
});
