/**
 * User & Authentication Service
 * Unified abstraction layer for User Management, Profiles, and Active Roles.
 */

import { mockService } from '../mocks/mockService';
import { User } from '../../interfaces/velica.interfaces';
import { UserRole } from '../../constants/roleConstants';

export const userService = {
  async getAll(): Promise<User[]> {
    return mockService.getUsers();
  },

  getCurrentUser(): User {
    return mockService.getCurrentUser();
  },

  getCurrentRole(): UserRole {
    return mockService.getCurrentRole();
  },

  setCurrentRole(role: UserRole): void {
    mockService.setCurrentRole(role);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return mockService.updateUser(id, data);
  },
};
