/// <reference types="vite/client" />
type PublicFeatureEnvironment = {
  VITE_FAITH_MOMENTS_ENABLED?: string;
  VITE_QUIET_PRESENCE_ENABLED?: string;
  VITE_QUIET_CORNER_ENABLED?: string;
};

/** Social features are deliberately opt-in at build time and off in public releases. */
export function getFeatureFlags(environment: PublicFeatureEnvironment = {
  VITE_FAITH_MOMENTS_ENABLED: import.meta.env.VITE_FAITH_MOMENTS_ENABLED,
  VITE_QUIET_PRESENCE_ENABLED: import.meta.env.VITE_QUIET_PRESENCE_ENABLED,
  VITE_QUIET_CORNER_ENABLED: import.meta.env.VITE_QUIET_CORNER_ENABLED,
}) {
  return {
    faithMoments: environment.VITE_FAITH_MOMENTS_ENABLED !== 'false',
    quietPresence: environment.VITE_QUIET_PRESENCE_ENABLED === 'true',
    quietCorner: environment.VITE_QUIET_CORNER_ENABLED === 'true',
  };
}
