/**
 * POS Terminal Service
 *
 * Purpose: CRUD for POS terminals (agent/merchant assignment, status).
 * Location: backend/src/services/posTerminals/PosTerminalService.ts
 */
export interface PosTerminal {
    id: string;
    terminalId: string;
    agentId: string | null;
    merchantId: string | null;
    status: string;
    deviceId: string | null;
    provisionedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export declare class PosTerminalService {
    getAll(filters?: {
        agentId?: string;
        merchantId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<PosTerminal[]>;
    getById(id: string): Promise<PosTerminal | null>;
    create(body: {
        terminalId: string;
        agentId?: string;
        merchantId?: string;
        status?: string;
        deviceId?: string;
    }): Promise<PosTerminal>;
    update(id: string, body: {
        terminalId?: string;
        agentId?: string | null;
        merchantId?: string | null;
        status?: string;
        deviceId?: string | null;
    }): Promise<PosTerminal | null>;
}
//# sourceMappingURL=PosTerminalService.d.ts.map