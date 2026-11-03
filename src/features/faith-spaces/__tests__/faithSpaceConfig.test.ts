import { describe, expect, it } from 'vitest';
import type { ReligionType } from '../../../types';
import { getFaithSpaceConfig, sceneConfigs } from '../faithSpaceConfig';

describe('faith space content', () => {
  it.each([
    ['道教', 'taoist'], ['佛教', 'buddhist'], ['基督教', 'christian'], ['天主教', 'catholic'], ['回教', 'islamic'],
  ] as const)('maps %s to its own scene', (religion, scene) => {
    expect(getFaithSpaceConfig(religion).id).toBe(scene);
  });

  it.each<ReligionType>(['一貫道', '天德教', '軒轅教', '理教', '巴哈伊教', '天理教', '其他', '未分類'])('uses a neutral fallback for %s', (religion) => {
    const config = getFaithSpaceConfig(religion);
    expect(config.id).toBe('generic');
    expect(config.introduction.en).toContain('not yet available');
  });

  it('provides complete bilingual content and reachable hotspots for every scene', () => {
    for (const config of Object.values(sceneConfigs)) {
      for (const content of [config.title, config.introduction, config.etiquette, ...config.hotspots.flatMap((spot) => [spot.title, spot.body])]) {
        expect(content.zh.trim().length).toBeGreaterThan(0);
        expect(content.en.trim().length).toBeGreaterThan(0);
        expect(content.zh).not.toEqual(content.en);
      }
      expect(config.hotspots.length).toBeGreaterThanOrEqual(3);
      expect(new Set(config.hotspots.map((spot) => spot.id)).size).toBe(config.hotspots.length);
      for (const spot of config.hotspots) {
        expect(spot.x).toBeGreaterThan(0);
        expect(spot.x).toBeLessThan(100);
        expect(spot.y).toBeGreaterThan(0);
        expect(spot.y).toBeLessThan(100);
      }
    }
  });
});
