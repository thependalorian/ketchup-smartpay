/**
 * ATM Service
 *
 * Purpose: CRUD and stats for ATMs (location, status, cash level, replenishment).
 * Location: backend/src/services/atms/AtmService.ts
 */
export interface Atm {
    id: string;
    terminalId: string;
    location: string;
    region: string | null;
    status: string;
    cashLevelPercent: number | null;
    mobileUnitId: string | null;
    lastServicedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface AtmStats {
    total: number;
    operational: number;
    offline: number;
    maintenance: number;
    lowCash: number;
}
export declare class AtmService {
    getAll(filters?: {
        region?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<Atm[]>;
    getById(id: string): Promise<Atm | null>;
    getStats(): Promise<AtmStats>;
    create(body: {
        terminalId: string;
        location: string;
        region?: string;
        status?: string;
        cashLevelPercent?: number;
        mobileUnitId?: string;
        lastServicedAt?: string;
    }): Promise<Atm>;
    update(id: string, body: {
        terminalId?: string;
        location?: string;
        region?: string;
        status?: string;
        cashLevelPercent?: number;
        mobileUnitId?: string | null;
        lastServicedAt?: string | null;
    }): Promise<Atm | null>;
}
//# sourceMappingURL=AtmService.d.ts.map