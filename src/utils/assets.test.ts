import { describe, expect, it } from 'vitest';
import { getPublicAssetPath } from './assets';

describe('asset utilities', () => {
  it('builds root-relative public asset paths by default', () => {
    expect(getPublicAssetPath('data/religious-organizations.json', '/')).toBe(
      '/data/religious-organizations.json',
    );
  });

  it('preserves a deployment subpath for GitHub Pages', () => {
    expect(getPublicAssetPath('/data/religious-summary.json', '/taipei-faith-map/')).toBe(
      '/taipei-faith-map/data/religious-summary.json',
    );
  });
});
