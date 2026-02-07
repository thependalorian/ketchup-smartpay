/**
 * Device Management Service – Remote device management for Ketchup POS/ATM
 *
 * Location: backend/src/services/security/DeviceManagementService.ts
 * Purpose: Remote device management, firmware updates, kill-switch (PRD FR3.7, SASSA-style agent device security).
 */
export interface DeviceRecord {
    deviceId: string;
    agentId: string;
    type: 'POS' | 'ATM' | 'kiosk';
    status: 'active' | 'suspended' | 'killed';
    firmwareVersion?: string;
    lastSeenAt?: string;
}
export declare class DeviceManagementService {
    /**
     * Kill-switch: remotely disable a compromised or lost device.
     */
    killDevice(deviceId: string, reason: string): Promise<{
        success: boolean;
        reason?: string;
    }>;
    /**
     * Push firmware update to device (staged rollout).
     */
    pushFirmwareUpdate(deviceId: string, version: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get device status for compliance/audit.
     */
    getDeviceStatus(deviceId: string): Promise<DeviceRecord | null>;
}
export declare const deviceManagementService: DeviceManagementService;
//# sourceMappingURL=DeviceManagementService.d.ts.map