/**
 * Device Security Tests – POS/ATM security and compliance (PRD FR3.7, FR3.8).
 * Location: backend/tests/DeviceSecurity.test.ts
 */

import { describe, it, expect } from 'vitest';
import { DeviceManagementService } from '../src/services/security/DeviceManagementService';
import { runPCIDSSChecks } from '../src/services/security/PCIDSSCompliance';

const deviceService = new DeviceManagementService();

describe('Device Security', () => {
  it('should kill device and return success', async () => {
    const result = await deviceService.killDevice('device-1', 'Lost device');
    expect(result.success).toBe(true);
  });

  it('should return device status', async () => {
    const status = await deviceService.getDeviceStatus('device-1');
    expect(status).not.toBeNull();
    expect(status?.deviceId).toBe('device-1');
    expect(status?.status).toBe('active');
  });

  it('should pass PCI DSS checks', () => {
    const results = runPCIDSSChecks();
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.passed)).toBe(true);
  });
});
