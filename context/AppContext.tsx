import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { User, Office, Token, Role, Priority, TokenStatus } from '../types';
import { MOCK_USERS, MOCK_OFFICES, MOCK_TOKENS } from '../constants';

interface AppNotification {
  userId: string;
  message: string;
  id: number;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  offices: Office[];
  tokens: Token[];
  notifications: AppNotification[];
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => { success: boolean, message: string };
  logout: () => void;
  setAuthenticatedUser: (payload: { id?: string; name?: string; email?: string; role?: string; assignedOfficeIds?: string[] }) => void;
  requestPasswordReset: (email: string) => void;
  bookToken: (officeId: string, purpose: string, priority: Priority) => void;
  callNextToken: (officeId: string) => void;
  completeToken: (tokenId: string) => void;
  addOffice: (office: Omit<Office, 'id'>) => void;
  updateOffice: (office: Office) => void;
  deleteOffice: (officeId: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  checkInStudent: (tokenId: string) => void;
  clearNotification: (notificationId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const hydrateStoredUser = (): User | null => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed) return null;
      const roleValue = (parsed.role || '').toString().toUpperCase();
      const role: Role = roleValue === 'ADMIN' ? Role.ADMIN : roleValue === 'STAFF' ? Role.STAFF : Role.STUDENT;
      return {
        id: parsed.id || `user-${Date.now()}`,
        name: parsed.name || 'User',
        email: parsed.email || '',
        role,
        assignedOfficeIds: parsed.assignedOfficeIds,
      };
    } catch (err) {
      console.error('Failed to hydrate user from localStorage:', err);
      return null;
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => hydrateStoredUser());
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [offices, setOffices] = useState<Office[]>(MOCK_OFFICES);
  const [tokens, setTokens] = useState<Token[]>(MOCK_TOKENS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const mapRole = (role?: string): Role => {
    if (!role) return Role.STUDENT;
    const upper = role.toUpperCase();
    if (upper === 'ADMIN') return Role.ADMIN;
    if (upper === 'STAFF' || upper === 'TEACHER') return Role.STAFF;
    return Role.STUDENT;
  };

  const setAuthenticatedUser = (payload: { id?: string; name?: string; email?: string; role?: string; assignedOfficeIds?: string[] }) => {
    const user: User = {
      id: payload.id || `user-${Date.now()}`,
      name: payload.name || 'User',
      email: payload.email || '',
      role: mapRole(payload.role),
      assignedOfficeIds: payload.assignedOfficeIds,
    };
    setCurrentUser(user);
  };

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, password: string): { success: boolean, message: string } => {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: 'An account with this email already exists.' };
    }
    
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password,
        role: Role.STUDENT,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true, message: 'Account created successfully!' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const requestPasswordReset = (email: string) => {
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    console.log(`Password reset requested for ${email}. User exists (for demo purposes): ${userExists}`);
    // In a real app, this would trigger an email only if the user exists.
    // For the UI, we always show a success message to prevent email enumeration attacks.
  };

  const bookToken = (officeId: string, purpose: string, priority: Priority) => {
    if (!currentUser || currentUser.role !== Role.STUDENT) return;
    const office = offices.find(o => o.id === officeId);
    if (!office) return;

    const officeTokensToday = tokens.filter(t => t.officeId === officeId && new Date(t.createdAt).toDateString() === new Date().toDateString());
    const tokenNumber = `${office.prefix}-${(officeTokensToday.length + 1).toString().padStart(3, '0')}`;
    
    const newToken: Token = {
      id: `token-${Date.now()}`,
      tokenNumber,
      studentId: currentUser.id,
      officeId,
      purpose,
      priority,
      status: TokenStatus.WAITING,
      createdAt: new Date(),
      isCheckedIn: false,
    };
    setTokens(prevTokens => [...prevTokens, newToken]);
  };
  
  const getSortedWaitingList = (officeId: string): Token[] => {
      return tokens
        .filter(t => t.officeId === officeId && t.status === TokenStatus.WAITING)
        .sort((a, b) => {
            if (a.priority === Priority.URGENT && b.priority !== Priority.URGENT) return -1;
            if (b.priority === Priority.URGENT && a.priority !== Priority.URGENT) return 1;
            if (a.priority === Priority.MEDICAL && b.priority !== Priority.MEDICAL) return -1;
            if (b.priority === Priority.MEDICAL && a.priority !== Priority.MEDICAL) return 1;
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
  };

  const callNextToken = (officeId: string) => {
    const waitingTokens = getSortedWaitingList(officeId);

    if (waitingTokens.length > 0) {
      const nextToken = waitingTokens[0];
      setTokens(prevTokens => 
        prevTokens.map(t => t.id === nextToken.id ? { ...t, status: TokenStatus.IN_PROGRESS, calledAt: new Date() } : t)
      );
    }
  };
  
  const checkInStudent = (tokenId: string) => {
      let officeId: string | null = null;
      setTokens(prevTokens =>
          prevTokens.map(t => {
              if (t.id === tokenId) {
                  officeId = t.officeId;
                  return { ...t, isCheckedIn: true };
              }
              return t;
          })
      );

      if (officeId) {
          const waitingList = getSortedWaitingList(officeId).filter(t => t.id !== tokenId);
          if (waitingList.length > 0) {
              const nextStudentToken = waitingList[0];
              const newNotification: AppNotification = {
                  userId: nextStudentToken.studentId,
                  message: `You are next in the queue for ${offices.find(o => o.id === officeId)?.name}! Please be ready.`,
                  id: Date.now()
              };
              setNotifications(prev => [...prev, newNotification]);
          }
      }
  };

  const completeToken = (tokenId: string) => {
    setTokens(prevTokens =>
      prevTokens.map(t => t.id === tokenId ? { ...t, status: TokenStatus.COMPLETED, completedAt: new Date() } : t)
    );
  };
    
  const addOffice = (officeData: Omit<Office, 'id'>) => {
    const newOffice: Office = { ...officeData, id: `office-${Date.now()}`};
    setOffices(prev => [...prev, newOffice]);
  };

  const updateOffice = (updatedOffice: Office) => {
    setOffices(prev => prev.map(o => o.id === updatedOffice.id ? updatedOffice : o));
  };
    
  const deleteOffice = (officeId: string) => {
    setOffices(prev => prev.filter(o => o.id !== officeId));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const clearNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };


  const value = useMemo(() => ({
  currentUser, users, offices, tokens, notifications,
  login, signup, logout, setAuthenticatedUser, requestPasswordReset, bookToken, callNextToken, completeToken,
    addOffice, updateOffice, deleteOffice,
    addUser, updateUser, deleteUser,
    checkInStudent, clearNotification,
  }), [currentUser, users, offices, tokens, notifications]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
