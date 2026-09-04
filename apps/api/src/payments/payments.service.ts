import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import {
  DataSource,
  Repository,
} from 'typeorm';

import { Account } from '../accounts/account.entity.js';
import {
  RealtimeEventType,
} from '../events/realtime.events.js';
import {
  RealtimeService,
} from '../events/realtime.service.js';
import { Organization } from '../organizations/organization.entity.js';
import {
  RiskDecision,
} from '../risk/risk-assessment.entity.js';
import {
  RiskService,
} from '../risk/risk.service.js';
import {
  CreateTransactionDto,
} from '../transactions/dto/create-transaction.dto.js';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/transaction.entity.js';
import {
  TransactionsService,
} from '../transactions/transactions.service.js';

import {
  CreatePaymentDto,
} from './dto/create-payment.dto.js';
import {
  Payment,
  PaymentStatus,
} from './payment.entity.js';
import {
  PaymentQueueService,
} from './queue/payment-queue.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository:
      Repository<Payment>,

    @InjectRepository(Account)
    private readonly accountsRepository:
      Repository<Account>,

    @InjectRepository(Organization)
    private readonly organizationsRepository:
      Repository<Organization>,

    @InjectRepository(Transaction)
    private readonly transactionsRepository:
      Repository<Transaction>,

    private readonly transactionsService:
      TransactionsService,

    private readonly paymentQueueService:
      PaymentQueueService,

    private readonly riskService:
      RiskService,

    private readonly realtimeService:
      RealtimeService,

    private readonly dataSource:
      DataSource,
  ) {}

  async create(
    userId: string,
    dto: CreatePaymentDto,
  ) {
    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id: dto.organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const requestFingerprint =
      this.createRequestFingerprint(dto);

    const existingPayment =
      await this.paymentsRepository.findOne({
        where: {
          organizationId:
            dto.organizationId,
          idempotencyKey:
            dto.idempotencyKey,
        },
      });

    if (existingPayment) {
      if (
        existingPayment.requestFingerprint !==
        requestFingerprint
      ) {
        throw new ConflictException(
          'Idempotency key has already been used with a different payment request',
        );
      }

      const transaction =
        existingPayment.transactionId
          ? await this.transactionsRepository.findOne({
              where: {
                id:
                  existingPayment.transactionId,
              },
            })
          : null;

      return {
        payment: existingPayment,
        transaction,
        idempotent: true,
      };
    }

    const debitAccount =
      await this.accountsRepository.findOne({
        where: {
          id: dto.debitAccountId,
          organizationId:
            dto.organizationId,
          isActive: true,
        },
      });

    if (!debitAccount) {
      throw new NotFoundException(
        'Debit account not found',
      );
    }

    const creditAccount =
      await this.accountsRepository.findOne({
        where: {
          id: dto.creditAccountId,
          organizationId:
            dto.organizationId,
          isActive: true,
        },
      });

    if (!creditAccount) {
      throw new NotFoundException(
        'Credit account not found',
      );
    }

    if (
      debitAccount.id ===
      creditAccount.id
    ) {
      throw new ConflictException(
        'Debit and credit accounts must be different',
      );
    }

    if (
      debitAccount.currency !==
        dto.currency ||
      creditAccount.currency !==
        dto.currency
    ) {
      throw new ConflictException(
        'Payment currency must match both account currencies',
      );
    }

    const amount =
      BigInt(dto.amount);

    if (amount <= 0n) {
      throw new ConflictException(
        'Payment amount must be greater than zero',
      );
    }

    const paymentReference =
      this.generateReference();

    const payment =
      this.paymentsRepository.create({
        organizationId:
          dto.organizationId,

        reference:
          paymentReference,

        idempotencyKey:
          dto.idempotencyKey,

        requestFingerprint,

        transactionId: null,

        status:
          PaymentStatus.PENDING,

        method:
          dto.method,

        amount:
          amount.toString(),

        currency:
          dto.currency,

        processorReference:
          null,

        failureReason:
          null,

        metadata: {
          debitAccountId:
            dto.debitAccountId,

          creditAccountId:
            dto.creditAccountId,

          description:
            dto.description?.trim() ??
            `Payment ${paymentReference}`,

          ...(dto.metadata ?? {}),
        },

        processedAt: null,
      });

    let savedPayment: Payment;

    try {
      savedPayment =
        await this.paymentsRepository.save(
          payment,
        );
    } catch (error) {
      const duplicatePayment =
        await this.paymentsRepository.findOne({
          where: {
            organizationId:
              dto.organizationId,

            idempotencyKey:
              dto.idempotencyKey,
          },
        });

      if (duplicatePayment) {
        if (
          duplicatePayment.requestFingerprint !==
          requestFingerprint
        ) {
          throw new ConflictException(
            'Idempotency key has already been used with a different payment request',
          );
        }

        const transaction =
          duplicatePayment.transactionId
            ? await this.transactionsRepository.findOne({
                where: {
                  id:
                    duplicatePayment.transactionId,
                },
              })
            : null;

        return {
          payment:
            duplicatePayment,

          transaction,

          idempotent: true,
        };
      }

      throw error;
    }

    this.realtimeService.publish(
      RealtimeEventType.PAYMENT_CREATED,
      savedPayment.organizationId,
      {
        paymentId:
          savedPayment.id,

        reference:
          savedPayment.reference,

        amount:
          savedPayment.amount,

        currency:
          savedPayment.currency,

        method:
          savedPayment.method,

        status:
          savedPayment.status,
      },
    );

    let riskResult;

    try {
      riskResult =
        await this.riskService.evaluate({
          organizationId:
            savedPayment.organizationId,

          paymentId:
            savedPayment.id,

          amount:
            savedPayment.amount,

          currency:
            savedPayment.currency,

          method:
            savedPayment.method,
        });
    } catch (error) {
      savedPayment.status =
        PaymentStatus.FAILED;

      savedPayment.failureReason =
        error instanceof Error
          ? `Risk evaluation failed: ${error.message}`
          : 'Risk evaluation failed';

      await this.paymentsRepository.save(
        savedPayment,
      );

      this.realtimeService.publish(
        RealtimeEventType.PAYMENT_FAILED,
        savedPayment.organizationId,
        {
          paymentId:
            savedPayment.id,

          reference:
            savedPayment.reference,

          reason:
            savedPayment.failureReason,
        },
      );

      throw error;
    }

    if (
      riskResult.decision ===
      RiskDecision.BLOCK
    ) {
      savedPayment.status =
        PaymentStatus.FAILED;

      savedPayment.failureReason =
        `Payment blocked by risk engine (score: ${riskResult.score})`;

      savedPayment.metadata = {
        ...(savedPayment.metadata ?? {}),

        riskDecision:
          RiskDecision.BLOCK,

        riskScore:
          riskResult.score,
      };

      const blockedPayment =
        await this.paymentsRepository.save(
          savedPayment,
        );

      this.realtimeService.publish(
        RealtimeEventType.PAYMENT_BLOCKED,
        blockedPayment.organizationId,
        {
          paymentId:
            blockedPayment.id,

          reference:
            blockedPayment.reference,

          score:
            riskResult.score,

          reason:
            blockedPayment.failureReason,
        },
      );

      return {
        payment:
          blockedPayment,

        transaction: null,

        queued: false,

        blocked: true,

        risk: {
          score:
            riskResult.score,

          decision:
            riskResult.decision,
        },

        idempotent: false,
      };
    }

    if (
      riskResult.decision ===
      RiskDecision.REVIEW
    ) {
      savedPayment.metadata = {
        ...(savedPayment.metadata ?? {}),

        riskDecision:
          RiskDecision.REVIEW,

        riskScore:
          riskResult.score,

        riskExplanation:
          riskResult.assessment
            .explanation,
      };

      const reviewPayment =
        await this.paymentsRepository.save(
          savedPayment,
        );

      this.realtimeService.publish(
        RealtimeEventType.PAYMENT_RISK_REVIEW,
        reviewPayment.organizationId,
        {
          paymentId:
            reviewPayment.id,

          reference:
            reviewPayment.reference,

          score:
            riskResult.score,

          decision:
            riskResult.decision,
        },
      );

      return {
        payment:
          reviewPayment,

        transaction: null,

        queued: false,

        reviewRequired: true,

        risk: {
          score:
            riskResult.score,

          decision:
            riskResult.decision,

          explanation:
            riskResult.assessment
              .explanation,
        },

        idempotent: false,
      };
    }

    savedPayment.metadata = {
      ...(savedPayment.metadata ?? {}),

      riskDecision:
        RiskDecision.ALLOW,

      riskScore:
        riskResult.score,
    };

    savedPayment =
      await this.paymentsRepository.save(
        savedPayment,
      );

    try {
      await this.paymentQueueService.enqueue(
        savedPayment.id,
        savedPayment.organizationId,
      );
    } catch (error) {
      savedPayment.status =
        PaymentStatus.FAILED;

      savedPayment.failureReason =
        error instanceof Error
          ? error.message
          : 'Payment job could not be queued';

      await this.paymentsRepository.save(
        savedPayment,
      );

      this.realtimeService.publish(
        RealtimeEventType.PAYMENT_FAILED,
        savedPayment.organizationId,
        {
          paymentId:
            savedPayment.id,

          reference:
            savedPayment.reference,

          reason:
            savedPayment.failureReason,
        },
      );

      throw error;
    }

    return {
      payment:
        savedPayment,

      transaction: null,

      queued: true,

      risk: {
        score:
          riskResult.score,

        decision:
          riskResult.decision,
      },

      idempotent: false,
    };
  }

  async processQueuedPayment(
    paymentId: string,
    organizationId: string,
    attempt = 1,
    maxAttempts = 3,
  ) {
    const payment =
      await this.paymentsRepository.findOne({
        where: {
          id: paymentId,
          organizationId,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    if (
      payment.status ===
      PaymentStatus.COMPLETED
    ) {
      const transaction =
        payment.transactionId
          ? await this.transactionsRepository.findOne({
              where: {
                id:
                  payment.transactionId,
              },
            })
          : null;

      return {
        payment,
        transaction,
        alreadyProcessed: true,
      };
    }

    /*
     * A previous attempt may have successfully created
     * the transaction and ledger entries but failed before
     * the payment record could be updated.
     *
     * Detect that transaction before creating another one.
     */
    const existingTransaction =
      await this.findTransactionForPayment(
        paymentId,
        organizationId,
      );

    if (existingTransaction) {
      payment.status =
        PaymentStatus.COMPLETED;

      payment.transactionId =
        existingTransaction.id;

      payment.processorReference =
        payment.processorReference ??
        this.generateProcessorReference();

      payment.failureReason =
        null;

      payment.processedAt =
        payment.processedAt ??
        existingTransaction.processedAt ??
        new Date();

      const completedPayment =
        await this.paymentsRepository.save(
          payment,
        );

      return {
        payment:
          completedPayment,

        transaction:
          existingTransaction,

        alreadyProcessed: true,
      };
    }

    const organization =
      await this.organizationsRepository.findOne({
        where: {
          id:
            payment.organizationId,

          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const metadata =
      payment.metadata ?? {};

    const debitAccountId =
      typeof metadata.debitAccountId ===
      'string'
        ? metadata.debitAccountId
        : null;

    const creditAccountId =
      typeof metadata.creditAccountId ===
      'string'
        ? metadata.creditAccountId
        : null;

    if (
      !debitAccountId ||
      !creditAccountId
    ) {
      return this.failPaymentAttempt(
        payment,
        new ConflictException(
          'Payment is missing account information',
        ),
        attempt,
        maxAttempts,
      );
    }

    payment.status =
      PaymentStatus.PROCESSING;

    payment.failureReason =
      null;

    await this.paymentsRepository.save(
      payment,
    );

    this.realtimeService.publish(
      RealtimeEventType.PAYMENT_PROCESSING,
      payment.organizationId,
      {
        paymentId:
          payment.id,

        reference:
          payment.reference,

        amount:
          payment.amount,

        currency:
          payment.currency,

        attempt,

        maxAttempts,
      },
    );

    try {
      const transactionDto:
        CreateTransactionDto = {
        organizationId:
          payment.organizationId,

        debitAccountId,

        creditAccountId,

        type:
          TransactionType.PAYMENT,

        amount:
          payment.amount,

        currency:
          payment.currency,

        description:
          typeof metadata.description ===
          'string'
            ? metadata.description
            : `Payment ${payment.reference}`,

        metadata: {
          paymentId:
            payment.id,

          paymentReference:
            payment.reference,

          paymentMethod:
            payment.method,

          idempotencyKey:
            payment.idempotencyKey,
        },
      };

      const transactionResult =
        await this.transactionsService.create(
          organization.ownerId,
          transactionDto,
        );

      const transaction =
        transactionResult.transaction;

      payment.status =
        PaymentStatus.COMPLETED;

      payment.transactionId =
        transaction.id;

      payment.processorReference =
        this.generateProcessorReference();

      payment.failureReason =
        null;

      payment.processedAt =
        new Date();

      const completedPayment =
        await this.paymentsRepository.save(
          payment,
        );

      this.realtimeService.publish(
        RealtimeEventType.PAYMENT_COMPLETED,
        completedPayment.organizationId,
        {
          paymentId:
            completedPayment.id,

          reference:
            completedPayment.reference,

          transactionId:
            transaction.id,

          amount:
            completedPayment.amount,

          currency:
            completedPayment.currency,

          processorReference:
            completedPayment.processorReference,

          attempt,
        },
      );

      this.realtimeService.publish(
        RealtimeEventType.TRANSACTION_COMPLETED,
        completedPayment.organizationId,
        {
          transactionId:
            transaction.id,

          paymentId:
            completedPayment.id,

          amount:
            transaction.amount,

          currency:
            transaction.currency,

          type:
            transaction.type,

          status:
            transaction.status,
        },
      );

      return {
        payment:
          completedPayment,

        transaction,

        alreadyProcessed: false,
      };
    } catch (error) {
      return this.failPaymentAttempt(
        payment,
        error,
        attempt,
        maxAttempts,
      );
    }
  }

  private async failPaymentAttempt(
    payment: Payment,
    error: unknown,
    attempt: number,
    maxAttempts: number,
  ): Promise<never> {
    const message =
      error instanceof Error
        ? error.message
        : 'Payment processing failed';

    const finalAttempt =
      attempt >= maxAttempts;

    if (finalAttempt) {
      payment.status =
        PaymentStatus.FAILED;

      payment.failureReason =
        message;
    } else {
      payment.status =
        PaymentStatus.PENDING;

      payment.failureReason =
        `Attempt ${attempt}/${maxAttempts} failed: ${message}`;
    }

    await this.paymentsRepository.save(
      payment,
    );

    this.realtimeService.publish(
      RealtimeEventType.PAYMENT_FAILED,
      payment.organizationId,
      {
        paymentId:
          payment.id,

        reference:
          payment.reference,

        reason:
          payment.failureReason,

        attempt,

        maxAttempts,

        retrying:
          !finalAttempt,
      },
    );

    throw error instanceof Error
      ? error
      : new Error(message);
  }

  private async findTransactionForPayment(
    paymentId: string,
    organizationId: string,
  ): Promise<Transaction | null> {
    return this.transactionsRepository
      .createQueryBuilder('transaction')
      .where(
        'transaction.organizationId = :organizationId',
        {
          organizationId,
        },
      )
      .andWhere(
        `transaction.metadata @> :metadata`,
        {
          metadata: JSON.stringify({
            paymentId,
          }),
        },
      )
      .getOne();
  }

  async findAllForUser(
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

    return this.paymentsRepository.find({
      where: {
        organizationId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOneForUser(
    userId: string,
    paymentId: string,
  ) {
    const payment =
      await this.paymentsRepository.findOne({
        where: {
          id: paymentId,
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
          id: payment.organizationId,
          ownerId: userId,
          isActive: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    return payment;
  }

  private createRequestFingerprint(
    dto: CreatePaymentDto,
  ): string {
    const normalizedRequest =
      JSON.stringify({
        organizationId:
          dto.organizationId,

        debitAccountId:
          dto.debitAccountId,

        creditAccountId:
          dto.creditAccountId,

        method:
          dto.method,

        amount:
          dto.amount,

        currency:
          dto.currency,

        description:
          dto.description?.trim() ??
          null,

        metadata:
          dto.metadata ?? null,
      });

    return createHash('sha256')
      .update(normalizedRequest)
      .digest('hex');
  }

  private generateReference(): string {
    const timestamp =
      Date.now().toString(36);

    const random =
      Math.random()
        .toString(36)
        .slice(2, 10);

    return `PAY-${timestamp}-${random}`.toUpperCase();
  }

  private generateProcessorReference(): string {
    const timestamp =
      Date.now().toString(36);

    const random =
      Math.random()
        .toString(36)
        .slice(2, 10);

    return `PROC-${timestamp}-${random}`.toUpperCase();
  }
}
