export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  PRO_EMPLOYEE = 'pro_employee',
  EMPLOYEE = 'employee'
}

export interface User {
  _id: string;
  name: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}