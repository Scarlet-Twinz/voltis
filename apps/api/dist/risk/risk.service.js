var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Payment, } from '../payments/payment.entity.js';
import { RiskAssessment, RiskDecision, } from './risk-assessment.entity.js';
let RiskService = class RiskService {
    assessmentsRepository;
    organizationsRepository;
    paymentsRepository;
    constructor(assessmentsRepository, organizationsRepository, paymentsRepository) {
        this.assessmentsRepository = assessmentsRepository;
        this.organizationsRepository = organizationsRepository;
        this.paymentsRepository = paymentsRepository;
    }
    async evaluate(input) {
        const payment = await this.paymentsRepository.findOne({
            where: {
                id: input.paymentId,
                organizationId: input.organizationId,
            },
        });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: input.organizationId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }
        let score = 0;
        const signals = {};
        const amount = BigInt(input.amount);
        const highValueThreshold = 1000000n;
        const extremeValueThreshold = 10000000n;
        if (amount >=
            extremeValueThreshold) {
            score += 70;
            signals.extremeAmount = true;
        }
        else if (amount >=
            highValueThreshold) {
            score += 35;
            signals.highAmount = true;
        }
        const recentPayments = await this.paymentsRepository
            .createQueryBuilder('payment')
            .where('payment.organizationId = :organizationId', {
            organizationId: input.organizationId,
        })
            .andWhere('payment.createdAt >= NOW() - INTERVAL \'10 minutes\'')
            .getCount();
        if (recentPayments >= 5) {
            score += 30;
            signals.velocity = {
                recentPayments,
                windowMinutes: 10,
            };
        }
        if (input.method === 'cash') {
            score += 5;
            signals.cashPayment = true;
        }
        if (input.currency !==
            organization.defaultCurrency) {
            score += 15;
            signals.currencyMismatch =
                true;
        }
        let decision = RiskDecision.ALLOW;
        if (score >= 70) {
            decision =
                RiskDecision.BLOCK;
        }
        else if (score >= 40) {
            decision =
                RiskDecision.REVIEW;
        }
        const explanation = decision ===
            RiskDecision.BLOCK
            ? 'Payment blocked because the calculated risk score is high'
            : decision ===
                RiskDecision.REVIEW
                ? 'Payment requires review because risk signals exceeded the review threshold'
                : 'Payment passed the configured risk checks';
        const assessment = this.assessmentsRepository.create({
            organizationId: input.organizationId,
            paymentId: input.paymentId,
            score,
            decision,
            signals,
            explanation,
        });
        const savedAssessment = await this.assessmentsRepository.save(assessment);
        return {
            assessment: savedAssessment,
            score,
            decision,
            allowed: decision ===
                RiskDecision.ALLOW,
        };
    }
    async findForPayment(paymentId) {
        return this.assessmentsRepository.find({
            where: {
                paymentId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async findForOrganization(userId, organizationId) {
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: organizationId,
                ownerId: userId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }
        return this.assessmentsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
};
RiskService = __decorate([
    Injectable(),
    __param(0, InjectRepository(RiskAssessment)),
    __param(1, InjectRepository(Organization)),
    __param(2, InjectRepository(Payment)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository])
], RiskService);
export { RiskService };
//# sourceMappingURL=risk.service.js.map