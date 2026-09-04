import type { Request } from 'express';
import { ReconciliationService } from './reconciliation.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class ReconciliationController {
    private readonly reconciliationService;
    constructor(reconciliationService: ReconciliationService);
    reconcile(request: AuthenticatedRequest, organizationId: string): Promise<import("./reconciliation-run.entity.js").ReconciliationRun | null>;
    findRuns(request: AuthenticatedRequest, organizationId: string): Promise<import("./reconciliation-run.entity.js").ReconciliationRun[]>;
    findOne(request: AuthenticatedRequest, runId: string): Promise<import("./reconciliation-run.entity.js").ReconciliationRun | {
        found: boolean;
    }>;
}
export {};
