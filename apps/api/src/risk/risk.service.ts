import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
} from 'typeorm';

import { Organization } from '../organizations/organization.entity.js';
import {
  Payment,
} from '../payments/payment.entity.js';

import {
  RiskAssessment,
  RiskDecision,
} from './risk-assessment.entity.js';

export interface RiskEvaluationInput {
  organizationId: string;
  paymentId: string;
  amount: string;
  currency: string;
  method: string;
}

@Injectable()
export class RiskService {
  constructor(
    @InjectRepository(RiskAssessment)
    private readonly assessmentsRepository:
      Repository<RiskAssessment>,

    @InjectRepository(Organization)
    private readonly organizationsRepository:
      Repository<Organization>,

    @InjectRepository(Payment)
    private readonly paymentsRepository:
      Repository<Payment>,
  ) {}

  async evaluate(
    input: RiskEvaluationInput,
  ) {
    const payment =
      await this.paymentsRepository.findOne({
        where: {
          id: input.paymentId,
          organizationId:
            input.organizationId,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: input.organizationId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    let score = 0;

    const signals: Record<
      string,
      unknown
    > = {};

    const amount =
      BigInt(input.amount);

    const highValueThreshold =
      1_000_000n;

    const extremeValueThreshold =
      10_000_000n;

    if (
      amount >=
      extremeValueThreshold
    ) {
      score += 70;

      signals.extremeAmount = true;
    } else if (
      amount >=
      highValueThreshold
    ) {
      score += 35;

      signals.highAmount = true;
    }

    const recentPayments =
      await this.paymentsRepository
        .createQueryBuilder('payment')
        .where(
          'payment.organizationId = :organizationId',
          {
            organizationId:
              input.organizationId,
          },
        )
        .andWhere(
          'payment.createdAt >= NOW() - INTERVAL \'10 minutes\'',
        )
        .getCount();

    if (recentPayments >= 5) {
      score += 30;

      signals.velocity = {
        recentPayments,
        windowMinutes: 10,
      };
    }

    if (
      input.method === 'cash'
    ) {
      score += 5;

      signals.cashPayment = true;
    }

    if (
      input.currency !==
      organization.defaultCurrency
    ) {
      score += 15;

      signals.currencyMismatch =
        true;
    }

    let decision =
      RiskDecision.ALLOW;

    if (score >= 70) {
      decision =
        RiskDecision.BLOCK;
    } else if (score >= 40) {
      decision =
        RiskDecision.REVIEW;
    }

    const explanation =
      decision ===
      RiskDecision.BLOCK
        ? 'Payment blocked because the calculated risk score is high'
        : decision ===
            RiskDecision.REVIEW
          ? 'Payment requires review because risk signals exceeded the review threshold'
          : 'Payment passed the configured risk checks';

    const assessment =
      this.assessmentsRepository.create({
        organizationId:
          input.organizationId,

        paymentId:
          input.paymentId,

        score,

        decision,

        signals,

        explanation,
      });

    const savedAssessment =
      await this.assessmentsRepository.save(
        assessment,
      );

    return {
      assessment:
        savedAssessment,
      score,
      decision,
      allowed:
        decision ===
        RiskDecision.ALLOW,
    };
  }

  async findForPayment(
    paymentId: string,
  ) {
    return this.assessmentsRepository.find({
      where: {
        paymentId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findForOrganization(
    userId: string,
    organizationId: string,
  ) {
    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
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
}
