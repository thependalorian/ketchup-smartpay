/**
 * Mobile Unit Service
 * Purpose: SmartPay Mobile – unit detail, equipment, drivers, issue/return, activity, maintenance.
 * Location: backend/src/services/mobileUnits/MobileUnitService.ts
 */
export interface MaintenanceEvent {
    id: string;
    mobileUnitId: string;
    equipmentId: string | null;
    type: string;
    description: string;
    partsUsed: string | null;
    cost: number | null;
    meterReading: string | null;
    createdAt: string;
}
export interface ActivityItem {
    type: 'equipment_issue' | 'equipment_return' | 'maintenance';
    at: string;
    id: string;
    description?: string;
    assetId?: string;
    equipmentTypeCode?: string;
    maintenanceType?: string;
    cost?: number | null;
    meterReading?: string | null;
}
export interface EquipmentType {
    code: string;
    label: string;
    category: string;
}
export interface MobileUnitEquipment {
    id: string;
    mobileUnitId: string;
    equipmentTypeCode: string;
    assetId: string;
    status: string;
    issuedAt: string;
    returnedAt: string | null;
    conditionNotes: string | null;
}
export interface MobileUnitDriver {
    id: string;
    mobileUnitId: string;
    name: string;
    idNumber: string | null;
    phone: string | null;
    role: string;
    assignedAt: string;
    status: string;
}
export declare class MobileUnitService {
    private agentService;
    getById(id: string): Promise<import("@/types").Agent | null>;
    getEquipment(mobileUnitId: string): Promise<MobileUnitEquipment[]>;
    getDrivers(mobileUnitId: string): Promise<MobileUnitDriver[]>;
    getEquipmentTypes(): Promise<EquipmentType[]>;
    issueEquipment(mobileUnitId: string, body: {
        equipmentTypeCode: string;
        assetId: string;
        notes?: string;
    }): Promise<MobileUnitEquipment>;
    returnEquipment(mobileUnitId: string, equipmentId: string): Promise<MobileUnitEquipment | null>;
    getActivity(mobileUnitId: string, limit?: number): Promise<ActivityItem[]>;
    postMaintenance(mobileUnitId: string, body: {
        type: string;
        description: string;
        partsUsed?: string;
        cost?: number;
        meterReading?: string;
        equipmentId?: string;
    }): Promise<MaintenanceEvent>;
    addDriver(mobileUnitId: string, body: {
        name: string;
        idNumber?: string;
        phone?: string;
        role?: string;
    }): Promise<MobileUnitDriver>;
    updateDriver(mobileUnitId: string, driverId: string, body: {
        name?: string;
        idNumber?: string;
        phone?: string;
        role?: string;
        status?: string;
    }): Promise<MobileUnitDriver | null>;
    removeDriver(mobileUnitId: string, driverId: string): Promise<boolean>;
}
//# sourceMappingURL=MobileUnitService.d.ts.map