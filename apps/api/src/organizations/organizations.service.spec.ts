import { describe, expect, it, vi } from 'vitest';

import { OrganizationsService } from './organizations.service.js';

describe('OrganizationsService', () => {
  it('should be defined', () => {
    const organizationsRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const usersRepository = {
      findOne: vi.fn(),
    };

    const service = new OrganizationsService(
      organizationsRepository as never,
      usersRepository as never,
    );

    expect(service).toBeDefined();
  });
});