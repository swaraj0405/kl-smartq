export enum Role {
  STUDENT = 'Student',
  STAFF = 'Staff',
  ADMIN = 'Admin',
}

export enum Priority {
  NORMAL = 'Normal',
  URGENT = 'Urgent',
  MEDICAL = 'Medical',
}

export enum TokenStatus {
  WAITING = 'Waiting',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface User {
  id: string;
  name: string;
  email: string;
  universityId?: string;
  password?: string;
  role: Role;
  assignedOfficeIds?: string[];
}

export interface Office {
  id: string;
  name: string;
  operatingHours: string;
  tokenLimit: number;
  isActive: boolean;
  prefix: string;
}

export interface Token {
  id: string;
  tokenNumber: string;
  studentId: string;
  officeId: string;
  purpose: string;
  priority: Priority;
  status: TokenStatus;
  createdAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  isCheckedIn: boolean;
}