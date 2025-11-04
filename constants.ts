import { Role, Priority, TokenStatus, User, Office, Token } from './types';

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@kluniversity.edu', universityId: '2300033156', role: Role.STUDENT, password: 'password123' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob.w@kluniversity.edu', universityId: '2300033157', role: Role.STUDENT, password: 'password123' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie.b@kluniversity.edu', role: Role.STAFF, assignedOfficeIds: ['office-1'], password: 'password123' },
  { id: 'user-4', name: 'Diana Prince', email: 'diana.p@kluniversity.edu', role: Role.STAFF, assignedOfficeIds: ['office-2', 'office-3'], password: 'password123' },
  { id: 'user-5', name: 'Edward Nygma', email: 'edward.n@kluniversity.edu', role: Role.ADMIN, password: 'password123' },
];

export const MOCK_OFFICES: Office[] = [
  { id: 'office-1', name: 'Registrar Office', operatingHours: '9 AM - 5 PM', tokenLimit: 100, isActive: true, prefix: 'REG' },
  { id: 'office-2', name: 'Finance Department', operatingHours: '9 AM - 4 PM', tokenLimit: 150, isActive: true, prefix: 'FIN' },
  { id: 'office-3', name: 'Student Affairs', operatingHours: '10 AM - 6 PM', tokenLimit: 80, isActive: true, prefix: 'SA' },
  { id: 'office-4', name: 'IT Support', operatingHours: '8 AM - 8 PM', tokenLimit: 200, isActive: false, prefix: 'ITS' },
];

const now = new Date();
export const MOCK_TOKENS: Token[] = [
  {
    id: 'token-1',
    tokenNumber: 'REG-001',
    studentId: 'user-1',
    officeId: 'office-1',
    purpose: 'Transcript Request',
    priority: Priority.NORMAL,
    status: TokenStatus.COMPLETED,
    createdAt: new Date(now.getTime() - 3600000 * 2), // 2 hours ago
    calledAt: new Date(now.getTime() - 3600000 * 1.9),
    completedAt: new Date(now.getTime() - 3600000 * 1.8),
    isCheckedIn: true,
  },
  {
    id: 'token-2',
    tokenNumber: 'FIN-001',
    studentId: 'user-2',
    officeId: 'office-2',
    purpose: 'Fee Payment',
    priority: Priority.URGENT,
    status: TokenStatus.IN_PROGRESS,
    createdAt: new Date(now.getTime() - 60000 * 30), // 30 mins ago
    calledAt: new Date(now.getTime() - 60000 * 5), // 5 mins ago
    isCheckedIn: true,
  },
  {
    id: 'token-3',
    tokenNumber: 'FIN-002',
    studentId: 'user-1',
    officeId: 'office-2',
    purpose: 'Scholarship Inquiry',
    priority: Priority.NORMAL,
    status: TokenStatus.WAITING,
    createdAt: new Date(now.getTime() - 60000 * 15), // 15 mins ago
    isCheckedIn: false,
  },
  {
    id: 'token-4',
    tokenNumber: 'SA-001',
    studentId: 'user-2',
    officeId: 'office-3',
    purpose: 'Club Registration',
    priority: Priority.NORMAL,
    status: TokenStatus.WAITING,
    createdAt: new Date(now.getTime() - 60000 * 10), // 10 mins ago
    isCheckedIn: false,
  },
];