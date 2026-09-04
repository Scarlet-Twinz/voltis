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
import { ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { DataSource, Repository, } from 'typeorm';
import { Account } from '../accounts/account.entity.js';
import { RealtimeEventType, } from '../events/realtime.events.js';
import { RealtimeService, } from '../events/realtime.service.js';
import { Organization } from '../organizations/organization.entity.js';
import { RiskDecision, } from '../risk/risk-assessment.entity.js';
import { RiskService, } from '../risk/risk.service.js';
import { Transaction, TransactionType, } from '../transactions/transaction.entity.js';
import { TransactionsService, } from '../transactions/transactions.service.js';
import { Payment, PaymentStatus, } from './payment.entity.js';
import { PaymentQueueService, } from './queue/payment-queue.service.js';
let PaymentsService = class PaymentsService {
    paymentsRepository;
    accountsRepository;
    organizationsRepository;
    transactionsRepository;
    transactionsService;
    paymentQueueService;
    riskService;
    realtimeService;
    dataSource;
    constructor(paymentsRepository, accountsRepository, organizationsRepository, transactionsRepository, transactionsService, paymentQueueService, riskService, realtimeService, dataSource) {
        this.paymentsRepository = paymentsRepository;
        this.accountsRepository = accountsRepository;
        this.organizationsRepository = organizationsRepository;
        this.transactionsRepository = transactionsRepository;
        this.transactionsService = transactionsService;
        this.paymentQueueService = paymentQueueService;
        this.riskService = riskService;
        this.realtimeService = realtimeService;
        this.dataSource = dataSource;
    }
    async create(userId, dto) {
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: dto.organizationId,
                ownerId: userId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }
        const requestFingerprint = this.createRequestFingerprint(dto);
        const existingPayment = await this.paymentsRepository.findOne({
            where: {
                organizationId: dto.organizationId,
                idempotencyKey: dto.idempotencyKey,
            },
        });
        if (existingPayment) {
            if (existingPayment.requestFingerprint !==
                requestFingerprint) {
                throw new ConflictException('Idempotency key has already been used with a different payment request');
            }
            const transaction = existingPayment.transactionId
                ? await this.transactionsRepository.findOne({
                    where: {
                        id: existingPayment.transactionId,
                    },
                })
                : null;
            return {
                payment: existingPayment,
                transaction,
                idempotent: true,
            };
        }
        const debitAccount = await this.accountsRepository.findOne({
            where: {
                id: dto.debitAccountId,
                organizationId: dto.organizationId,
                isActive: true,
            },
        });
        if (!debitAccount) {
            throw new NotFoundException('Debit account not found');
        }
        const creditAccount = await this.accountsRepository.findOne({
            where: {
                id: dto.creditAccountId,
                organizationId: dto.organizationId,
                isActive: true,
            },
        });
        if (!creditAccount) {
            throw new NotFoundException('Credit account not found');
        }
        if (debitAccount.id ===
            creditAccount.id) {
            throw new ConflictException('Debit and credit accounts must be different');
        }
        if (debitAccount.currency !==
            dto.currency ||
            creditAccount.currency !==
                dto.currency) {
            throw new ConflictException('Payment currency must match both account currencies');
        }
        const amount = BigInt(dto.amount);
        if (amount <= 0n) {
            throw new ConflictException('Payment amount must be greater than zero');
        }
        const paymentReference = this.generateReference();
        const payment = this.paymentsRepository.create({
            organizationId: dto.organizationId,
            reference: paymentReference,
            idempotencyKey: dto.idempotencyKey,
            requestFingerprint,
            transactionId: null,
            status: PaymentStatus.PENDING,
            method: dto.method,
            amount: amount.toString(),
            currency: dto.currency,
            processorReference: null,
            failureReason: null,
            metadata: {
                debitAccountId: dto.debitAccountId,
                creditAccountId: dto.creditAccountId,
                description: dto.description?.trim() ??
                    `Payment ${paymentReference}`,
                ...(dto.metadata ?? {}),
            },
            processedAt: null,
        });
        let savedPayment;
        try {
            savedPayment =
                await this.paymentsRepository.save(payment);
        }
        catch (error) {
            const duplicatePayment = await this.paymentsRepository.findOne({
                where: {
                    organizationId: dto.organizationId,
                    idempotencyKey: dto.idempotencyKey,
                },
            });
            if (duplicatePayment) {
                if (duplicatePayment.requestFingerprint !==
                    requestFingerprint) {
                    throw new ConflictException('Idempotency key has already been used with a different payment request');
                }
                const transaction = duplicatePayment.transactionId
                    ? await this.transactionsRepository.findOne({
                        where: {
                            id: duplicatePayment.transactionId,
                        },
                    })
                    : null;
                return {
                    payment: duplicatePayment,
                    transaction,
                    idempotent: true,
                };
            }
            throw error;
        }
        this.realtimeService.publish(RealtimeEventType.PAYMENT_CREATED, savedPayment.organizationId, {
            paymentId: savedPayment.id,
            reference: savedPayment.reference,
            amount: savedPayment.amount,
            currency: savedPayment.currency,
            method: savedPayment.method,
            status: savedPayment.status,
        });
        let riskResult;
        try {
            riskResult =
                await this.riskService.evaluate({
                    organizationId: savedPayment.organizationId,
                    paymentId: savedPayment.id,
                    amount: savedPayment.amount,
                    currency: savedPayment.currency,
                    method: savedPayment.method,
                });
        }
        catch (error) {
            savedPayment.status =
                PaymentStatus.FAILED;
            savedPayment.failureReason =
                error instanceof Error
                    ? `Risk evaluation failed: ${error.message}`
                    : 'Risk evaluation failed';
            await this.paymentsRepository.save(savedPayment);
            this.realtimeService.publish(RealtimeEventType.PAYMENT_FAILED, savedPayment.organizationId, {
                paymentId: savedPayment.id,
                reference: savedPayment.reference,
                reason: savedPayment.failureReason,
            });
            throw error;
        }
        if (riskResult.decision ===
            RiskDecision.BLOCK) {
            savedPayment.status =
                PaymentStatus.FAILED;
            savedPayment.failureReason =
                `Payment blocked by risk engine (score: ${riskResult.score})`;
            savedPayment.metadata = {
                ...(savedPayment.metadata ?? {}),
                riskDecision: RiskDecision.BLOCK,
                riskScore: riskResult.score,
            };
            const blockedPayment = await this.paymentsRepository.save(savedPayment);
            this.realtimeService.publish(RealtimeEventType.PAYMENT_BLOCKED, blockedPayment.organizationId, {
                paymentId: blockedPayment.id,
                reference: blockedPayment.reference,
                score: riskResult.score,
                reason: blockedPayment.failureReason,
            });
            return {
                payment: blockedPayment,
                transaction: null,
                queued: false,
                blocked: true,
                risk: {
                    score: riskResult.score,
                    decision: riskResult.decision,
                },
                idempotent: false,
            };
        }
        if (riskResult.decision ===
            RiskDecision.REVIEW) {
            savedPayment.metadata = {
                ...(savedPayment.metadata ?? {}),
                riskDecision: RiskDecision.REVIEW,
                riskScore: riskResult.score,
                riskExplanation: riskResult.assessment
                    .explanation,
            };
            const reviewPayment = await this.paymentsRepository.save(savedPayment);
            this.realtimeService.publish(RealtimeEventType.PAYMENT_RISK_REVIEW, reviewPayment.organizationId, {
                paymentId: reviewPayment.id,
                reference: reviewPayment.reference,
                score: riskResult.score,
                decision: riskResult.decision,
            });
            return {
                payment: reviewPayment,
                transaction: null,
                queued: false,
                reviewRequired: true,
                risk: {
                    score: riskResult.score,
                    decision: riskResult.decision,
                    explanation: riskResult.assessment
                        .explanation,
                },
                idempotent: false,
            };
        }
        savedPayment.metadata = {
            ...(savedPayment.metadata ?? {}),
            riskDecision: RiskDecision.ALLOW,
            riskScore: riskResult.score,
        };
        savedPayment =
            await this.paymentsRepository.save(savedPayment);
        try {
            await this.paymentQueueService.enqueue(savedPayment.id, savedPayment.organizationId);
        }
        catch (error) {
            savedPayment.status =
                PaymentStatus.FAILED;
            savedPayment.failureReason =
                error instanceof Error
                    ? error.message
                    : 'Payment job could not be queued';
            await this.paymentsRepository.save(savedPayment);
            this.realtimeService.publish(RealtimeEventType.PAYMENT_FAILED, savedPayment.organizationId, {
                paymentId: savedPayment.id,
                reference: savedPayment.reference,
                reason: savedPayment.failureReason,
            });
            throw error;
        }
        return {
            payment: savedPayment,
            transaction: null,
            queued: true,
            risk: {
                score: riskResult.score,
                decision: riskResult.decision,
            },
            idempotent: false,
        };
    }
    async processQueuedPayment(paymentId, organizationId, attempt = 1, maxAttempts = 3) {
        const payment = await this.paymentsRepository.findOne({
            where: {
                id: paymentId,
                organizationId,
            },
        });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        if (payment.status ===
            PaymentStatus.COMPLETED) {
            const transaction = payment.transactionId
                ? await this.transactionsRepository.findOne({
                    where: {
                        id: payment.transactionId,
                    },
                })
                : null;
            return {
                payment,
                transaction,
                alreadyProcessed: true,
            };
        }
        const existingTransaction = await this.findTransactionForPayment(paymentId, organizationId);
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
            const completedPayment = await this.paymentsRepository.save(payment);
            return {
                payment: completedPayment,
                transaction: existingTransaction,
                alreadyProcessed: true,
            };
        }
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: payment.organizationId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }
        const metadata = payment.metadata ?? {};
        const debitAccountId = typeof metadata.debitAccountId ===
            'string'
            ? metadata.debitAccountId
            : null;
        const creditAccountId = typeof metadata.creditAccountId ===
            'string'
            ? metadata.creditAccountId
            : null;
        if (!debitAccountId ||
            !creditAccountId) {
            return this.failPaymentAttempt(payment, new ConflictException('Payment is missing account information'), attempt, maxAttempts);
        }
        payment.status =
            PaymentStatus.PROCESSING;
        payment.failureReason =
            null;
        await this.paymentsRepository.save(payment);
        this.realtimeService.publish(RealtimeEventType.PAYMENT_PROCESSING, payment.organizationId, {
            paymentId: payment.id,
            reference: payment.reference,
            amount: payment.amount,
            currency: payment.currency,
            attempt,
            maxAttempts,
        });
        try {
            const transactionDto = {
                organizationId: payment.organizationId,
                debitAccountId,
                creditAccountId,
                type: TransactionType.PAYMENT,
                amount: payment.amount,
                currency: payment.currency,
                description: typeof metadata.description ===
                    'string'
                    ? metadata.description
                    : `Payment ${payment.reference}`,
                metadata: {
                    paymentId: payment.id,
                    paymentReference: payment.reference,
                    paymentMethod: payment.method,
                    idempotencyKey: payment.idempotencyKey,
                },
            };
            const transactionResult = await this.transactionsService.create(organization.ownerId, transactionDto);
            const transaction = transactionResult.transaction;
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
            const completedPayment = await this.paymentsRepository.save(payment);
            this.realtimeService.publish(RealtimeEventType.PAYMENT_COMPLETED, completedPayment.organizationId, {
                paymentId: completedPayment.id,
                reference: completedPayment.reference,
                transactionId: transaction.id,
                amount: completedPayment.amount,
                currency: completedPayment.currency,
                processorReference: completedPayment.processorReference,
                attempt,
            });
            this.realtimeService.publish(RealtimeEventType.TRANSACTION_COMPLETED, completedPayment.organizationId, {
                transactionId: transaction.id,
                paymentId: completedPayment.id,
                amount: transaction.amount,
                currency: transaction.currency,
                type: transaction.type,
                status: transaction.status,
            });
            return {
                payment: completedPayment,
                transaction,
                alreadyProcessed: false,
            };
        }
        catch (error) {
            return this.failPaymentAttempt(payment, error, attempt, maxAttempts);
        }
    }
    async failPaymentAttempt(payment, error, attempt, maxAttempts) {
        const message = error instanceof Error
            ? error.message
            : 'Payment processing failed';
        const finalAttempt = attempt >= maxAttempts;
        if (finalAttempt) {
            payment.status =
                PaymentStatus.FAILED;
            payment.failureReason =
                message;
        }
        else {
            payment.status =
                PaymentStatus.PENDING;
            payment.failureReason =
                `Attempt ${attempt}/${maxAttempts} failed: ${message}`;
        }
        await this.paymentsRepository.save(payment);
        this.realtimeService.publish(RealtimeEventType.PAYMENT_FAILED, payment.organizationId, {
            paymentId: payment.id,
            reference: payment.reference,
            reason: payment.failureReason,
            attempt,
            maxAttempts,
            retrying: !finalAttempt,
        });
        throw error instanceof Error
            ? error
            : new Error(message);
    }
    async findTransactionForPayment(paymentId, organizationId) {
        return this.transactionsRepository
            .createQueryBuilder('transaction')
            .where('transaction.organizationId = :organizationId', {
            organizationId,
        })
            .andWhere(`transaction.metadata @> :metadata`, {
            metadata: JSON.stringify({
                paymentId,
            }),
        })
            .getOne();
    }
    async findAllForUser(userId, organizationId) {
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
        return this.paymentsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async findOneForUser(userId, paymentId) {
        const payment = await this.paymentsRepository.findOne({
            where: {
                id: paymentId,
            },
        });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        const organization = await this.organizationsRepository.findOne({
            where: {
                id: payment.organizationId,
                ownerId: userId,
                isActive: true,
            },
        });
        if (!organization) {
            throw new NotFoundException('Payment not found');
        }
        return payment;
    }
    createRequestFingerprint(dto) {
        const normalizedRequest = JSON.stringify({
            organizationId: dto.organizationId,
            debitAccountId: dto.debitAccountId,
            creditAccountId: dto.creditAccountId,
            method: dto.method,
            amount: dto.amount,
            currency: dto.currency,
            description: dto.description?.trim() ??
                null,
            metadata: dto.metadata ?? null,
        });
        return createHash('sha256')
            .update(normalizedRequest)
            .digest('hex');
    }
    generateReference() {
        const timestamp = Date.now().toString(36);
        const random = Math.random()
            .toString(36)
            .slice(2, 10);
        return `PAY-${timestamp}-${random}`.toUpperCase();
    }
    generateProcessorReference() {
        const timestamp = Date.now().toString(36);
        const random = Math.random()
            .toString(36)
            .slice(2, 10);
        return `PROC-${timestamp}-${random}`.toUpperCase();
    }
};
PaymentsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Payment)),
    __param(1, InjectRepository(Account)),
    __param(2, InjectRepository(Organization)),
    __param(3, InjectRepository(Transaction)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        TransactionsService,
        PaymentQueueService,
        RiskService,
        RealtimeService,
        DataSource])
], PaymentsService);
export { PaymentsService };
//# sourceMappingURL=payments.service.js.map