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
import { DataSource, Repository, } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';
import { Payment, PaymentStatus, } from '../payments/payment.entity.js';
import { LedgerEntry, LedgerEntryType, } from '../ledger/ledger-entry.entity.js';
import { Transaction, TransactionStatus, } from '../transactions/transaction.entity.js';
import { ReconciliationDiscrepancy, ReconciliationDiscrepancyType, } from './reconciliation-discrepancy.entity.js';
import { ReconciliationRun, ReconciliationStatus, } from './reconciliation-run.entity.js';
let ReconciliationService = class ReconciliationService {
    runsRepository;
    discrepanciesRepository;
    paymentsRepository;
    transactionsRepository;
    ledgerEntriesRepository;
    organizationsRepository;
    dataSource;
    constructor(runsRepository, discrepanciesRepository, paymentsRepository, transactionsRepository, ledgerEntriesRepository, organizationsRepository, dataSource) {
        this.runsRepository = runsRepository;
        this.discrepanciesRepository = discrepanciesRepository;
        this.paymentsRepository = paymentsRepository;
        this.transactionsRepository = transactionsRepository;
        this.ledgerEntriesRepository = ledgerEntriesRepository;
        this.organizationsRepository = organizationsRepository;
        this.dataSource = dataSource;
    }
    async reconcile(userId, organizationId) {
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
        const run = this.runsRepository.create({
            organizationId,
            status: ReconciliationStatus.RUNNING,
            paymentsChecked: 0,
            transactionsChecked: 0,
            ledgerEntriesChecked: 0,
            matchedCount: 0,
            discrepancyCount: 0,
            failureReason: null,
            completedAt: null,
        });
        await this.runsRepository.save(run);
        try {
            const payments = await this.paymentsRepository.find({
                where: {
                    organizationId,
                },
            });
            const transactions = await this.transactionsRepository.find({
                where: {
                    organizationId,
                },
            });
            const transactionIds = transactions.map((transaction) => transaction.id);
            const ledgerEntries = transactionIds.length > 0
                ? await this.ledgerEntriesRepository
                    .createQueryBuilder('entry')
                    .innerJoin('entry.transaction', 'transaction')
                    .where('transaction.organizationId = :organizationId', { organizationId })
                    .getMany()
                : [];
            run.paymentsChecked =
                payments.length;
            run.transactionsChecked =
                transactions.length;
            run.ledgerEntriesChecked =
                ledgerEntries.length;
            const transactionMap = new Map(transactions.map((transaction) => [
                transaction.id,
                transaction,
            ]));
            const entriesByTransaction = new Map();
            for (const entry of ledgerEntries) {
                const entries = entriesByTransaction.get(entry.transactionId) ?? [];
                entries.push(entry);
                entriesByTransaction.set(entry.transactionId, entries);
            }
            let matchedCount = 0;
            for (const payment of payments) {
                if (payment.status ===
                    PaymentStatus.PENDING ||
                    payment.status ===
                        PaymentStatus.PROCESSING) {
                    continue;
                }
                if (!payment.transactionId) {
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .MISSING_TRANSACTION,
                        paymentId: payment.id,
                        transactionId: null,
                        message: 'Completed or failed payment has no transaction reference',
                        details: {
                            paymentStatus: payment.status,
                            amount: payment.amount,
                            currency: payment.currency,
                        },
                    });
                    continue;
                }
                const transaction = transactionMap.get(payment.transactionId);
                if (!transaction) {
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .TRANSACTION_NOT_FOUND,
                        paymentId: payment.id,
                        transactionId: payment.transactionId,
                        message: 'Payment references a transaction that does not exist',
                        details: null,
                    });
                    continue;
                }
                let paymentMatched = true;
                if (BigInt(payment.amount) !==
                    BigInt(transaction.amount)) {
                    paymentMatched = false;
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .AMOUNT_MISMATCH,
                        paymentId: payment.id,
                        transactionId: transaction.id,
                        message: 'Payment amount does not match transaction amount',
                        details: {
                            paymentAmount: payment.amount,
                            transactionAmount: transaction.amount,
                        },
                    });
                }
                if (payment.currency !==
                    transaction.currency) {
                    paymentMatched = false;
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .CURRENCY_MISMATCH,
                        paymentId: payment.id,
                        transactionId: transaction.id,
                        message: 'Payment currency does not match transaction currency',
                        details: {
                            paymentCurrency: payment.currency,
                            transactionCurrency: transaction.currency,
                        },
                    });
                }
                if (payment.status ===
                    PaymentStatus.COMPLETED &&
                    transaction.status !==
                        TransactionStatus.COMPLETED) {
                    paymentMatched = false;
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .STATUS_MISMATCH,
                        paymentId: payment.id,
                        transactionId: transaction.id,
                        message: 'Completed payment does not have a completed transaction',
                        details: {
                            paymentStatus: payment.status,
                            transactionStatus: transaction.status,
                        },
                    });
                }
                const entries = entriesByTransaction.get(transaction.id) ?? [];
                if (entries.length < 2) {
                    paymentMatched = false;
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .MISSING_LEDGER_ENTRIES,
                        paymentId: payment.id,
                        transactionId: transaction.id,
                        message: 'Transaction does not have the required double-entry ledger records',
                        details: {
                            entryCount: entries.length,
                        },
                    });
                }
                const debitTotal = entries
                    .filter((entry) => entry.type ===
                    LedgerEntryType.DEBIT)
                    .reduce((sum, entry) => sum +
                    BigInt(entry.amount), 0n);
                const creditTotal = entries
                    .filter((entry) => entry.type ===
                    LedgerEntryType.CREDIT)
                    .reduce((sum, entry) => sum +
                    BigInt(entry.amount), 0n);
                if (debitTotal !== creditTotal) {
                    paymentMatched = false;
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .UNBALANCED_LEDGER,
                        paymentId: payment.id,
                        transactionId: transaction.id,
                        message: 'Ledger debit and credit totals do not balance',
                        details: {
                            debitTotal: debitTotal.toString(),
                            creditTotal: creditTotal.toString(),
                        },
                    });
                }
                if (debitTotal !==
                    BigInt(transaction.amount) ||
                    creditTotal !==
                        BigInt(transaction.amount)) {
                    paymentMatched = false;
                    await this.recordDiscrepancy(run, {
                        organizationId,
                        type: ReconciliationDiscrepancyType
                            .TRANSACTION_LEDGER_AMOUNT_MISMATCH,
                        paymentId: payment.id,
                        transactionId: transaction.id,
                        message: 'Ledger total does not match transaction amount',
                        details: {
                            transactionAmount: transaction.amount,
                            debitTotal: debitTotal.toString(),
                            creditTotal: creditTotal.toString(),
                        },
                    });
                }
                if (paymentMatched) {
                    matchedCount += 1;
                }
            }
            run.matchedCount =
                matchedCount;
            run.discrepancyCount =
                await this.discrepanciesRepository.count({
                    where: {
                        runId: run.id,
                    },
                });
            run.status =
                ReconciliationStatus.COMPLETED;
            run.completedAt =
                new Date();
            await this.runsRepository.save(run);
            return this.getRun(run.id);
        }
        catch (error) {
            run.status =
                ReconciliationStatus.FAILED;
            run.failureReason =
                error instanceof Error
                    ? error.message
                    : 'Reconciliation failed';
            run.completedAt =
                new Date();
            await this.runsRepository.save(run);
            throw error;
        }
    }
    async getRun(runId) {
        return this.runsRepository.findOne({
            where: {
                id: runId,
            },
            relations: {
                discrepancies: true,
            },
        });
    }
    async findRunsForUser(userId, organizationId) {
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
        return this.runsRepository.find({
            where: {
                organizationId,
            },
            order: {
                createdAt: 'DESC',
            },
            relations: {
                discrepancies: true,
            },
        });
    }
    async recordDiscrepancy(run, data) {
        const discrepancy = this.discrepanciesRepository.create({
            runId: run.id,
            organizationId: data.organizationId,
            type: data.type,
            paymentId: data.paymentId,
            transactionId: data.transactionId,
            message: data.message,
            details: data.details,
            resolved: false,
        });
        await this.discrepanciesRepository.save(discrepancy);
    }
};
ReconciliationService = __decorate([
    Injectable(),
    __param(0, InjectRepository(ReconciliationRun)),
    __param(1, InjectRepository(ReconciliationDiscrepancy)),
    __param(2, InjectRepository(Payment)),
    __param(3, InjectRepository(Transaction)),
    __param(4, InjectRepository(LedgerEntry)),
    __param(5, InjectRepository(Organization)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        DataSource])
], ReconciliationService);
export { ReconciliationService };
//# sourceMappingURL=reconciliation.service.js.map