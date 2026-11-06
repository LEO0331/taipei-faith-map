const failure = 'Privileged credentials cannot be included in public Vite configuration.';

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
}
