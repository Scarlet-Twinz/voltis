import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('should be defined', () => {
    const usersRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const jwtService = {
      sign: vi.fn(),
    };

    const service = new AuthService(
      usersRepository as never,
      jwtService as never,
    );

    expect(service).toBeDefined();
  });

  it('should normalize email and create a user during registration', async () => {
    const usersRepository = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data) => ({
        id: 'user-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: vi.fn().mockImplementation(async (user) => user),
    };

    const jwtService = {
      sign: vi.fn().mockReturnValue('test-token'),
    };

    const service = new AuthService(
      usersRepository as never,
      jwtService as never,
    );

    const result = await service.register({
      email: '  TEST@VOLTIS.DEV  ',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123',
    });

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: {
        email: 'test@voltis.dev',
      },
    });

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@voltis.dev',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      }),
    );

    expect(result.accessToken).toBe('test-token');
    expect(result.user.email).toBe('test@voltis.dev');
  });
});