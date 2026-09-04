import { describe, expect, it, vi } from 'vitest';

import { AccountsController } from './accounts.controller.js';

describe('AccountsController', () => {
  it('should be defined', () => {
    const accountsService = {
      create: vi.fn(),
      findAllForUser: vi.fn(),
      findOneForUser: vi.fn(),
    };

    const controller = new AccountsController(
      accountsService as never,
    );

    expect(controller).toBeDefined();
  });
});