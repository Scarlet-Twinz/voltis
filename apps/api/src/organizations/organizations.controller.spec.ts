import { describe, expect, it, vi } from 'vitest';

import { OrganizationsController } from './organizations.controller.js';

describe('OrganizationsController', () => {
  it('should be defined', () => {
    const organizationsService = {
      create: vi.fn(),
      findAllForUser: vi.fn(),
      findOneForUser: vi.fn(),
    };

    const controller = new OrganizationsController(
      organizationsService as never,
    );

    expect(controller).toBeDefined();
  });
});