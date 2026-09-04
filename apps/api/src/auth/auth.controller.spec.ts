import { describe, expect, it, vi } from 'vitest';

import { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  it('should be defined', () => {
    const authService = {
      register: vi.fn(),
      login: vi.fn(),
      getMe: vi.fn(),
    };

    const controller = new AuthController(
      authService as never,
    );

    expect(controller).toBeDefined();
  });
});