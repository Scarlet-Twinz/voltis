import { describe, expect, it, vi } from 'vitest';

import { AccountsService } from './accounts.service.js';

describe('AccountsService', () => {
  it('should be defined', () => {
    const accountsRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const organizationsRepository = {
      findOne: vi.fn(),
    };

    const service = new AccountsService(
      accountsRepository as never,
      organizationsRepository as never,
    );

    expect(service).toBeDefined();
  });
});