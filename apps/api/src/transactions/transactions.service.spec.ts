import { describe, expect, it } from 'vitest';
import { DataSource } from 'typeorm';

import { Account, AccountType } from '../accounts/account.entity.js';
import { User } from '../users/user.entity.js';
import { Organization } from '../organizations/organization.entity.js';
import {
  Transaction,
  TransactionType,
} from './transaction.entity.js';
import { LedgerEntry } from '../ledger/ledger-entry.entity.js';
import { TransactionsService } from './transactions.service.js';

describe('TransactionsService concurrency', () => {
  it(
    'allows only one of two simultaneous withdrawals when the balance is insufficient for both',
    async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5436),
        username: process.env.DB_USER ?? 'voltis',
        password:
          process.env.DB_PASSWORD ??
          'voltis_dev_password',
        database: process.env.DB_NAME ?? 'voltis',
        entities: [
          User,
          Organization,
          Account,
          Transaction,
          LedgerEntry,
        ],
        synchronize: true,
        dropSchema: true,
      });

      await dataSource.initialize();

      try {
        const userRepository =
          dataSource.getRepository(User);

        const organizationRepository =
          dataSource.getRepository(Organization);

        const accountRepository =
          dataSource.getRepository(Account);

        const transactionRepository =
          dataSource.getRepository(Transaction);

        const ledgerRepository =
          dataSource.getRepository(LedgerEntry);

        const user = await userRepository.save(
          userRepository.create({
            email: `concurrency-${Date.now()}@voltis.test`,
            passwordHash: 'test-hash',
            firstName: 'Concurrency',
            lastName: 'Test',
            isActive: true,
          }),
        );

        const organization =
          await organizationRepository.save(
            organizationRepository.create({
              name: `Concurrency Test ${Date.now()}`,
              slug: `concurrency-test-${Date.now()}`,
              defaultCurrency: 'USD',
              isActive: true,
              ownerId: user.id,
              owner: user,
            }),
          );

        const liabilityAccount =
          await accountRepository.save(
            accountRepository.create({
              organizationId: organization.id,
              organization,
              code: 'CUSTOMER-FUNDS',
              name: 'Customer Funds',
              type: AccountType.LIABILITY,
              currency: 'USD',
              balance: '10000',
              isActive: true,
            }),
          );

        const cashAccount =
          await accountRepository.save(
            accountRepository.create({
              organizationId: organization.id,
              organization,
              code: 'CONCURRENCY-CASH',
              name: 'Concurrency Cash',
              type: AccountType.ASSET,
              currency: 'USD',
              balance: '10000',
              isActive: true,
            }),
          );

        const service =
          new TransactionsService(
            transactionRepository,
            accountRepository,
            dataSource,
            organizationRepository,
          );

        const transactionDto = {
          organizationId: organization.id,
          debitAccountId: liabilityAccount.id,
          creditAccountId: cashAccount.id,
          type: TransactionType.WITHDRAWAL,
          amount: '7000',
          currency: 'USD',
          description: 'Concurrent withdrawal test',
        };

        const results =
          await Promise.allSettled([
            service.create(
              user.id,
              transactionDto,
            ),
            service.create(
              user.id,
              transactionDto,
            ),
          ]);

        const successful =
          results.filter(
            (result) =>
              result.status === 'fulfilled',
          );

        const failed =
          results.filter(
            (result) =>
              result.status === 'rejected',
          );

        expect(successful).toHaveLength(1);
        expect(failed).toHaveLength(1);

        const finalLiability =
          await accountRepository.findOneByOrFail({
            id: liabilityAccount.id,
          });

        const finalCash =
          await accountRepository.findOneByOrFail({
            id: cashAccount.id,
          });

        expect(finalLiability.balance).toBe(
          '3000',
        );

        expect(finalCash.balance).toBe(
          '3000',
        );

        const transactions =
          await transactionRepository.find({
            where: {
              organizationId: organization.id,
            },
          });

        expect(transactions).toHaveLength(1);
        expect(transactions[0].amount).toBe(
          '7000',
        );
        expect(
          transactions[0].status,
        ).toBe('completed');
      } finally {
        await dataSource.destroy();
      }
    },
    30000,
  );
});
