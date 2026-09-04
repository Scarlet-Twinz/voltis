import { NotFoundException } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service.js';
import {
  ReconciliationDiscrepancyType,
} from './reconciliation-discrepancy.entity.js';
import {
  ReconciliationStatus,
} from './reconciliation-run.entity.js';
import {
  PaymentStatus,
} from '../payments/payment.entity.js';
import {
  TransactionStatus,
} from '../transactions/transaction.entity.js';
import {
  LedgerEntryType,
} from '../ledger/ledger-entry.entity.js';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  const runsRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  };

  const discrepanciesRepository = {
    create: vi.fn(),
    save: vi.fn(),
    count: vi.fn(),
  };

  const paymentsRepository = {
    find: vi.fn(),
  };

  const transactionsRepository = {
    find: vi.fn(),
  };

  const ledgerEntriesRepository = {
    createQueryBuilder: vi.fn(),
  };

  const organizationsRepository = {
    findOne: vi.fn(),
  };

  const dataSource = {};

  beforeEach(() => {
    vi.clearAllMocks();

    service = new ReconciliationService(
      runsRepository as any,
      discrepanciesRepository as any,
      paymentsRepository as any,
      transactionsRepository as any,
      ledgerEntriesRepository as any,
      organizationsRepository as any,
      dataSource as any,
    );

    runsRepository.create.mockImplementation(
      (value: any) => ({
        id: 'run-1',
        ...value,
      }),
    );

    runsRepository.save.mockImplementation(
      async (value: any) => value,
    );

    discrepanciesRepository.create.mockImplementation(
      (value: any) => value,
    );

    discrepanciesRepository.save.mockImplementation(
      async (value: any) => value,
    );

    discrepanciesRepository.count.mockResolvedValue(
      0,
    );

    runsRepository.findOne.mockResolvedValue({
      id: 'run-1',
      status: ReconciliationStatus.COMPLETED,
      discrepancies: [],
    });

    organizationsRepository.findOne.mockResolvedValue({
      id: 'org-1',
      ownerId: 'user-1',
      isActive: true,
    });
  });

  function mockLedgerEntries(
    entries: any[],
  ) {
    const queryBuilder = {
      innerJoin: vi.fn(),
      where: vi.fn(),
      getMany: vi.fn().mockResolvedValue(entries),
    };

    queryBuilder.innerJoin.mockReturnValue(
      queryBuilder,
    );

    queryBuilder.where.mockReturnValue(
      queryBuilder,
    );

    ledgerEntriesRepository.createQueryBuilder.mockReturnValue(
      queryBuilder,
    );
  }

  it('rejects reconciliation for an organization the user does not own', async () => {
    organizationsRepository.findOne.mockResolvedValue(
      null,
    );

    await expect(
      service.reconcile(
        'user-1',
        'org-1',
      ),
    ).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(
      runsRepository.create,
    ).not.toHaveBeenCalled();
  });

  it('reconciles a valid payment, transaction, and balanced ledger successfully', async () => {
    const payment = {
      id: 'payment-1',
      organizationId: 'org-1',
      transactionId: 'transaction-1',
      status: PaymentStatus.COMPLETED,
      amount: '1000',
      currency: 'USD',
    };

    const transaction = {
      id: 'transaction-1',
      organizationId: 'org-1',
      status: TransactionStatus.COMPLETED,
      amount: '1000',
      currency: 'USD',
    };

    const ledgerEntries = [
      {
        id: 'entry-1',
        transactionId: 'transaction-1',
        type: LedgerEntryType.DEBIT,
        amount: '1000',
      },
      {
        id: 'entry-2',
        transactionId: 'transaction-1',
        type: LedgerEntryType.CREDIT,
        amount: '1000',
      },
    ];

    paymentsRepository.find.mockResolvedValue([
      payment,
    ]);

    transactionsRepository.find.mockResolvedValue([
      transaction,
    ]);

    mockLedgerEntries(ledgerEntries);

    discrepanciesRepository.count.mockResolvedValue(
      0,
    );

    const result =
      await service.reconcile(
        'user-1',
        'org-1',
      );

    expect(result).toEqual({
      id: 'run-1',
      status: ReconciliationStatus.COMPLETED,
      discrepancies: [],
    });

    expect(
      runsRepository.save,
    ).toHaveBeenCalled();

    expect(
      discrepanciesRepository.create,
    ).not.toHaveBeenCalled();

    const savedRun =
      runsRepository.save.mock.calls.at(-1)?.[0];

    expect(savedRun.matchedCount).toBe(1);
    expect(savedRun.discrepancyCount).toBe(0);
    expect(savedRun.status).toBe(
      ReconciliationStatus.COMPLETED,
    );
    expect(savedRun.completedAt).toBeInstanceOf(
      Date,
    );
  });

  it('records amount and currency discrepancies', async () => {
    const payment = {
      id: 'payment-1',
      organizationId: 'org-1',
      transactionId: 'transaction-1',
      status: PaymentStatus.COMPLETED,
      amount: '1500',
      currency: 'NGN',
    };

    const transaction = {
      id: 'transaction-1',
      organizationId: 'org-1',
      status: TransactionStatus.COMPLETED,
      amount: '1000',
      currency: 'USD',
    };

    const ledgerEntries = [
      {
        id: 'entry-1',
        transactionId: 'transaction-1',
        type: LedgerEntryType.DEBIT,
        amount: '1000',
      },
      {
        id: 'entry-2',
        transactionId: 'transaction-1',
        type: LedgerEntryType.CREDIT,
        amount: '1000',
      },
    ];

    paymentsRepository.find.mockResolvedValue([
      payment,
    ]);

    transactionsRepository.find.mockResolvedValue([
      transaction,
    ]);

    mockLedgerEntries(ledgerEntries);

    discrepanciesRepository.count.mockResolvedValue(
      2,
    );

    await service.reconcile(
      'user-1',
      'org-1',
    );

    const discrepancyTypes =
      discrepanciesRepository.create.mock.calls.map(
        (call: any[]) => call[0].type,
      );

    expect(
      discrepancyTypes,
    ).toContain(
      ReconciliationDiscrepancyType.AMOUNT_MISMATCH,
    );

    expect(
      discrepancyTypes,
    ).toContain(
      ReconciliationDiscrepancyType.CURRENCY_MISMATCH,
    );
  });

  it('records missing transaction and missing ledger discrepancies', async () => {
    const payment = {
      id: 'payment-1',
      organizationId: 'org-1',
      transactionId: null,
      status: PaymentStatus.COMPLETED,
      amount: '1000',
      currency: 'USD',
    };

    paymentsRepository.find.mockResolvedValue([
      payment,
    ]);

    transactionsRepository.find.mockResolvedValue([]);

    mockLedgerEntries([]);

    discrepanciesRepository.count.mockResolvedValue(
      1,
    );

    await service.reconcile(
      'user-1',
      'org-1',
    );

    expect(
      discrepanciesRepository.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-1',
        organizationId: 'org-1',
        type:
          ReconciliationDiscrepancyType.MISSING_TRANSACTION,
        paymentId: 'payment-1',
        transactionId: null,
        resolved: false,
      }),
    );
  });

  it('records an unbalanced ledger discrepancy', async () => {
    const payment = {
      id: 'payment-1',
      organizationId: 'org-1',
      transactionId: 'transaction-1',
      status: PaymentStatus.COMPLETED,
      amount: '1000',
      currency: 'USD',
    };

    const transaction = {
      id: 'transaction-1',
      organizationId: 'org-1',
      status: TransactionStatus.COMPLETED,
      amount: '1000',
      currency: 'USD',
    };

    const ledgerEntries = [
      {
        id: 'entry-1',
        transactionId: 'transaction-1',
        type: LedgerEntryType.DEBIT,
        amount: '1000',
      },
      {
        id: 'entry-2',
        transactionId: 'transaction-1',
        type: LedgerEntryType.CREDIT,
        amount: '900',
      },
    ];

    paymentsRepository.find.mockResolvedValue([
      payment,
    ]);

    transactionsRepository.find.mockResolvedValue([
      transaction,
    ]);

    mockLedgerEntries(ledgerEntries);

    discrepanciesRepository.count.mockResolvedValue(
      1,
    );

    await service.reconcile(
      'user-1',
      'org-1',
    );

    expect(
      discrepanciesRepository.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        type:
          ReconciliationDiscrepancyType.UNBALANCED_LEDGER,
        paymentId: 'payment-1',
        transactionId: 'transaction-1',
      }),
    );
  });
});
