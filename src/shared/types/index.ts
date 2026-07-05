import { ROLES } from '../constants';

export type Role = keyof typeof ROLES;

export interface User {
  id: string;
  email: string;
  role: Role;
  restaurantId?: string;
  branchId?: string;
  createdAt: Date;
}
