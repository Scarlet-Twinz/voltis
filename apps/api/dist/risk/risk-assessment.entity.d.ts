export declare enum RiskDecision {
    ALLOW = "allow",
    REVIEW = "review",
    BLOCK = "block"
}
export declare class RiskAssessment {
    id: string;
    organizationId: string;
    paymentId: string;
    score: number;
    decision: RiskDecision;
    signals: Record<string, unknown>;
    explanation: string | null;
    createdAt: Date;
}
