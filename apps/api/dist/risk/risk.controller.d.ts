import type { Request } from 'express';
import { RiskService } from './risk.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class RiskController {
    private readonly riskService;
    constructor(riskService: RiskService);
    findForPayment(paymentId: string): Promise<import("./risk-assessment.entity.js").RiskAssessment[]>;
    findForOrganization(request: AuthenticatedRequest, organizationId: string): Promise<import("./risk-assessment.entity.js").RiskAssessment[]>;
}
export {};
