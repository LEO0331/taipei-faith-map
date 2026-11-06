import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('GitHub Pages public configuration handoff', () => {
  it('passes only the three public repository variables while retaining launch gates', () => {
    const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
    const build = workflow.split('- name: Build')[1]?.split('- name: Verify GitHub Pages assets')[0];
    expect(build).toBeTruthy();
    for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_TURNSTILE_SITE_KEY']) {
      expect(build).toContain(name + ': ${{ vars.' + name + ' }}');
    }
    expect(build).toContain("GITHUB_PAGES: 'true'");
    expect(build).toContain("VITE_QUIET_PRESENCE_ENABLED: 'false'");
    expect(build).toContain("VITE_QUIET_CORNER_ENABLED: 'false'");
    expect(build).not.toMatch(/secrets\.|SERVICE_ROLE|SECRET_KEY/);
  });
});
