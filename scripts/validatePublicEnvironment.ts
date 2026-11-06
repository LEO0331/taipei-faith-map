const failure = 'Privileged credentials cannot be included in public Vite configuration.';

function validPublicUrl(value: string): boolean {
  if (value !== value.trim()) return false;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) return false;
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return (local && url.protocol === 'http:') || (url.protocol === 'https:' && !url.port && /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname));
  } catch { return false; }
}

/** Build-time guard only. Never return or log secret values. */
export function validatePublicEnvironment(environment: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(environment)) {
    if (!name.startsWith('VITE_') || !value) continue;
    if (/SECRET|SERVICE_?ROLE|DATABASE_PASSWORD|ADMIN_JWT|PRIVATE_KEY/i.test(name) || value.includes('sb_secret_')) throw new Error(failure);
    const pieces = value.split('.');
    if (pieces.length === 3) {
      try {
        const claims = JSON.parse(Buffer.from(pieces[1], 'base64url').toString('utf8')) as { role?: unknown };
        if (claims.role === 'service_role' || claims.role === 'supabase_admin') throw new Error(failure);
      } catch (error) { if (error instanceof Error && error.message === failure) throw error; }
    }
  }
  const key = environment.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (key && !/^sb_publishable_[A-Za-z0-9_-]{12,256}$/.test(key)) throw new Error('Use a public Supabase publishable key for the optional browser client.');
  const url = environment.VITE_SUPABASE_URL;
  if (url && !validPublicUrl(url)) throw new Error('VITE_SUPABASE_URL must be a hosted Supabase HTTPS origin or a local HTTP origin.');
  const siteKey = environment.VITE_SUPABASE_TURNSTILE_SITE_KEY;
  if (siteKey && !/^[A-Za-z0-9_-]{8,200}$/.test(siteKey)) throw new Error('VITE_SUPABASE_TURNSTILE_SITE_KEY must be a valid public Turnstile site key.');

  const sharedEnabled = environment.VITE_QUIET_PRESENCE_ENABLED === 'true' || environment.VITE_QUIET_CORNER_ENABLED === 'true';
  if (!sharedEnabled) return;
  for (const [name, value] of [['VITE_SUPABASE_URL', url], ['VITE_SUPABASE_PUBLISHABLE_KEY', key], ['VITE_SUPABASE_TURNSTILE_SITE_KEY', siteKey]]) {
    if (!value) throw new Error(`${name} is required when an optional shared feature is enabled.`);
  }
}
