import { describe, it, expect } from 'vitest';
import { migratePreferences } from '../persistence/migrations';
import { DEFAULT_PREFERENCES } from '../persistence/schema';

describe('Persistence & Auto-Recovery', () => {
  it('safely recovers defaults when storage contains null or non-object', () => {
    expect(migratePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(migratePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(migratePreferences('corrupt-string')).toEqual(DEFAULT_PREFERENCES);
    expect(migratePreferences(12345)).toEqual(DEFAULT_PREFERENCES);
  });

  it('preserves valid user preferences while healing corrupted fields', () => {
    const partiallyCorrupt = {
      theme: 'light',
      wallpaperId: 'carbon-grid',
      iconScale: 'invalid-scale', // Should heal to default
      pinnedAppIds: 'not-an-array', // Should heal to default
      autoHideTaskbar: true,
    };

    const healed = migratePreferences(partiallyCorrupt);
    expect(healed.theme).toBe('light');
    expect(healed.wallpaperId).toBe('carbon-grid');
    expect(healed.iconScale).toBe(DEFAULT_PREFERENCES.iconScale);
    expect(healed.pinnedAppIds).toEqual(DEFAULT_PREFERENCES.pinnedAppIds);
    expect(healed.autoHideTaskbar).toBe(true);
  });
});
