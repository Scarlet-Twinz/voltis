import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { RiskAssessment, RiskDecision } from './risk-assessment.entity.js';
export interface RiskEvaluationInput {
    organizationId: string;
    paymentId: string;
    amount: string;
    currency: string;
    method: string;
}
export declare class RiskService {
    private readonly assessmentsRepository;
    private readonly organizationsRepository;
    private readonly paymentsRepository;
    constructor(assessmentsRepository: Repository<RiskAssessment>, organizationsRepository: Repository<Organization>, paymentsRepository: Repository<Payment>);
    evaluate(input: RiskEvaluationInput): Promise<{
        assessment: RiskAssessment;
        score: number;
        decision: RiskDecision;
        allowed: boolean;
    }>;
    findForPayment(paymentId: string): Promise<RiskAssessment[]>;
    findForOrganization(userId: string, organizationId: string): Promise<RiskAssessment[]>;
}
