import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFeatureFlags } from './featureFlags';

describe('independent public feature flags', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('reads the actual Vite configuration rather than an inert ImportMeta wrapper', () => {
    vi.stubEnv('VITE_FAITH_MOMENTS_ENABLED', 'false');
    vi.stubEnv('VITE_QUIET_PRESENCE_ENABLED', 'true');
    expect(getFeatureFlags()).toEqual({ faithMoments: false, quietPresence: true, quietCorner: false });
  });
  it('keeps solo interaction available and public shared features disabled by default', () => {
    expect(getFeatureFlags({})).toEqual({ faithMoments: true, quietPresence: false, quietCorner: false });
  });
  it('requires an explicit true for each optional shared feature', () => {
    expect(getFeatureFlags({ VITE_FAITH_MOMENTS_ENABLED: 'false', VITE_QUIET_PRESENCE_ENABLED: 'true', VITE_QUIET_CORNER_ENABLED: 'false' })).toEqual({ faithMoments: false, quietPresence: true, quietCorner: false });
    expect(getFeatureFlags({ VITE_QUIET_PRESENCE_ENABLED: '1', VITE_QUIET_CORNER_ENABLED: 'true' })).toEqual({ faithMoments: true, quietPresence: false, quietCorner: true });
  });
});
