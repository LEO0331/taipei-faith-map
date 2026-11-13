import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

describe('GitHub Pages permissions', () => {
  it('limits Pages write and OIDC permissions to the deploy job', () => {
    const [defaults, jobs] = workflow.split(/^jobs:\s*$/m);
    const [build, deploy] = jobs.split(/^  deploy:\s*$/m);
    expect(defaults).toMatch(/^permissions: \{\}$/m);
    expect(build).toMatch(/^    permissions:\r?\n      contents: read\r?\n      pages: read\r?\n    steps:/m);
    expect(build).toMatch(/^          persist-credentials: false$/m);
    expect(deploy).toMatch(/^    permissions:\r?\n      pages: write\r?\n      id-token: write\r?\n    environment:/m);
  });
});

describe('GitHub Pages public configuration handoff', () => {
  it('passes public variables for the owner-authorized Garden pilot while keeping Corner off', () => {
    const build = workflow.split('- name: Build')[1]?.split('- name: Verify GitHub Pages assets')[0];
    expect(build).toBeTruthy();
    for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_TURNSTILE_SITE_KEY']) {
      expect(build).toContain(name + ': ${{ vars.' + name + ' }}');
    }
    expect(build).toContain("GITHUB_PAGES: 'true'");
    expect(build).toContain("VITE_QUIET_PRESENCE_ENABLED: 'true'");
    expect(build).toContain("VITE_QUIET_CORNER_ENABLED: 'false'");
    expect(build).not.toMatch(/secrets\.|SERVICE_ROLE|SECRET_KEY/);
  });
});
