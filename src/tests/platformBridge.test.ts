import { describe, it, expect } from 'vitest';
import { MockPlatformAdapter } from '../platform/mockAdapter';

describe('Platform Adapter Contract', () => {
  const adapter = new MockPlatformAdapter();

  it('exposes valid desktop capabilities structure', async () => {
    const caps = await adapter.getCapabilities();
    expect(caps).toHaveProperty('canListLaunchableApps');
    expect(caps).toHaveProperty('canLaunchAndroidApps');
    expect(caps).toHaveProperty('hasExternalDisplay');
    expect(caps).toHaveProperty('supportsSeparateExternalDesktop');
    expect(caps).toHaveProperty('supportsSystemWindowing');
    expect(caps).toHaveProperty('isTouchScreen');
    expect(caps.canListLaunchableApps).toBe(true);
  });

  it('returns typed success result when querying installed apps', async () => {
    const res = await adapter.getInstalledApps();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(Array.isArray(res.value)).toBe(true);
      expect(res.value.length).toBeGreaterThan(0);
      const first = res.value[0];
      expect(first).toHaveProperty('packageName');
      expect(first).toHaveProperty('label');
      expect(first).toHaveProperty('isSystemApp');
    }
  });

  it('handles non-existent app launch with typed error response instead of throwing', async () => {
    const res = await adapter.launchApp('non.existent.application');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('APP_NOT_FOUND');
      expect(res.message).toBeDefined();
    }
  });
});
