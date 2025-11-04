import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, Role } from '../../types';
import { EditIcon, TrashIcon } from '../common/Icons';
import * as adminApi from '../../src/api/admin';

type UserFormData = {
    id?: string;
    name: string;
    email: string;
    role: Role;
    password?: string;
    assignedOfficeIds?: string[];
};

const roleToBackend = (role: Role): string => {
    if (role === Role.ADMIN) return 'ADMIN';
    if (role === Role.STAFF) return 'STAFF';
    return 'STUDENT';
};

const roleFromBackend = (value?: string | null): Role => {
    const normalized = (value || '').toUpperCase();
    if (normalized === 'ADMIN') return Role.ADMIN;
    if (normalized === 'STAFF' || normalized === 'TEACHER') return Role.STAFF;
    return Role.STUDENT;
};

const mapServerUserToClient = (payload: any): User => ({
    id: payload?.id || `user-${Date.now()}`,
    name: payload?.name || 'Unknown User',
    email: payload?.email || '',
    role: roleFromBackend(payload?.role),
    assignedOfficeIds: payload?.assignedOfficeIds || [],
});

const UserForm: React.FC<{ user?: User; onSave: (user: UserFormData) => Promise<void>; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const { offices } = useAppContext();
    const [formData, setFormData] = useState<UserFormData>({
        id: user?.id,
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || Role.STAFF,
        password: '',
        assignedOfficeIds: user?.assignedOfficeIds || [],
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'role') {
                const nextRole = value as Role;
                return {
                    ...prev,
                    role: nextRole,
                    assignedOfficeIds: nextRole === Role.STAFF ? (prev.assignedOfficeIds || []) : [],
                };
            }
            if (name === 'password') {
                return { ...prev, password: value };
            }
            if (name === 'email') {
                return { ...prev, email: value };
            }
            if (name === 'name') {
                return { ...prev, name: value };
            }
            return prev;
        });
    };

    const handleOfficeToggle = (officeId: string) => {
        const assigned = formData.assignedOfficeIds || [];
        const newAssignedOfficeIds = assigned.includes(officeId)
            ? assigned.filter(id => id !== officeId)
            : [...assigned, officeId];
        setFormData(prev => ({ ...prev, assignedOfficeIds: newAssignedOfficeIds }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            if (user) {
                const { password, ...rest } = formData;
                await onSave({ ...rest, id: user.id });
            } else {
                await onSave(formData);
            }
        } catch (err: any) {
            setSubmitError(err?.message || err?.data?.error || 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const assigned = formData.assignedOfficeIds || [];
    const assignedOfficesDetails = offices.filter(o => assigned.includes(o.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                 <h2 className="text-2xl font-bold mb-6 text-neutral-800">{user ? 'Edit User' : 'Add User'}</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light" required />
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light" required />
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light">
                        <option value={Role.STAFF}>Staff</option>
                        <option value={Role.ADMIN}>Admin</option>
                        <option value={Role.STUDENT}>Student</option>
                    </select>
                    {!user && (
                        <input
                            type="password"
                            name="password"
                            placeholder="Temporary Password"
                            value={formData.password || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light"
                            required
                        />
                    )}
                    {formData.role === Role.STAFF && (
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Assigned Offices</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full p-2 border border-neutral-300 rounded-md bg-white text-neutral-900 text-left flex justify-between items-center"
                                    aria-haspopup="listbox"
                                    aria-expanded={isDropdownOpen}
                                >
                                    <div className="flex flex-wrap gap-1 items-center min-h-[24px]">
                                        {assignedOfficesDetails.length > 0 ? (
                                            assignedOfficesDetails.map(office => (
                                                <span key={office.id} className="bg-neutral-200 text-neutral-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                                                    {office.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-neutral-500">Select offices...</span>
                                        )}
                                    </div>
                                    <svg className={`w-4 h-4 text-neutral-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg" role="listbox">
                                        <ul className="max-h-48 overflow-y-auto">
                                            {offices.map(office => (
                                                <li
                                                    key={office.id}
                                                    className="px-4 py-2 hover:bg-neutral-100 cursor-pointer flex items-center"
                                                    onClick={() => handleOfficeToggle(office.id)}
                                                    role="option"
                                                    aria-selected={assigned.includes(office.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={assigned.includes(office.id)}
                                                        readOnly
                                                        className="mr-3 h-4 w-4 rounded border-neutral-300 text-primary-light focus:ring-primary-light cursor-pointer"
                                                    />
                                                    <span className="text-neutral-800">{office.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                                        {submitError && <p className="text-sm text-red-600 text-center">{submitError}</p>}
                                        <div className="flex justify-end space-x-4 pt-4">
                                                <button type="button" onClick={onCancel} className="px-6 py-2 bg-neutral-200 text-neutral-800 font-semibold rounded-lg hover:bg-neutral-300 transition-colors">Cancel</button>
                                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-70 disabled:cursor-not-allowed">{isSubmitting ? 'Saving...' : 'Save'}</button>
                    </div>
                 </form>
            </div>
        </div>
    )
};


const UserManagementPage: React.FC = () => {
    const { offices, currentUser } = useAppContext();
    const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setPageError(null);
        try {
                const response = await adminApi.fetchUsers();
                const normalized = Array.isArray(response) ? response.map(mapServerUserToClient) : [];
                setUsers(normalized);
        } catch (err: any) {
                const message = err?.message || err?.data?.error || 'Failed to load users';
                setPageError(message);
        } finally {
                setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSave = useCallback(async (userData: UserFormData) => {
        const assignedOfficeIds = userData.role === Role.STAFF ? (userData.assignedOfficeIds || []) : [];

        if (userData.id) {
            try {
                const payload = {
                    name: userData.name.trim(),
                    email: userData.email.trim(),
                    role: roleToBackend(userData.role),
                    assignedOfficeIds,
                };
                const updated = await adminApi.updateUser(userData.id, payload);
                const normalized = mapServerUserToClient(updated);
                setUsers(prev => prev.map(u => u.id === normalized.id ? normalized : u));
                setIsModalOpen(false);
                setEditingUser(undefined);
                setPageError(null);
            } catch (err) {
                throw err;
            }
            return;
        }

        try {
            const payload = {
                name: userData.name.trim(),
                email: userData.email.trim(),
                password: userData.password || '',
                role: roleToBackend(userData.role),
                assignedOfficeIds,
            };
            const created = await adminApi.createUser(payload);
            const normalized = mapServerUserToClient(created);
            setUsers(prev => [...prev, normalized]);
            setIsModalOpen(false);
            setEditingUser(undefined);
            setPageError(null);
        } catch (err) {
            throw err;
        }
    }, []);
  
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

    const handleDelete = async (userId: string) => {
        if (currentUser && currentUser.id === userId) {
                alert('You cannot delete the currently logged-in admin.');
                return;
        }
        if (!window.confirm('Are you sure you want to delete this user?')) {
                return;
        }
        try {
                await adminApi.deleteUser(userId);
                setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
                const message = err?.message || err?.data?.error || 'Failed to delete user';
                setPageError(message);
        }
    };

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (roleFilter === 'All') return true;
        return user.role === roleFilter;
      })
      .filter(user => {
        const term = searchTerm.toLowerCase();
        return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      });
  }, [users, searchTerm, roleFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">User Management</h1>
        <button onClick={() => { setEditingUser(undefined); setIsModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light">Add User</button>
      </div>

            {pageError && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                        {pageError}
                </div>
            )}

      <div className="flex items-center space-x-4 mb-4">
        <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light"
        />
        <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as Role | 'All')}
            className="px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-primary-light focus:border-primary-light"
        >
            <option value="All">All Roles</option>
            <option value={Role.ADMIN}>Admin</option>
            <option value={Role.STAFF}>Staff</option>
            <option value={Role.STUDENT}>Student</option>
        </select>
      </div>

       {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredUsers.map(user => {
            const assignedOfficeNames = user.assignedOfficeIds?.map(id => offices.find(o => o.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
            return (
                <div key={user.id} className="bg-white rounded-lg shadow-md border border-neutral-200 p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg text-neutral-800">{user.name}</p>
                            <p className="text-sm text-neutral-600">{user.email}</p>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                            <button onClick={() => openEditModal(user)} className="text-neutral-500 hover:text-blue-600 transition-colors" title="Edit User">
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(user.id)} className="text-neutral-500 hover:text-red-600 transition-colors" title="Delete User">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                        <p className="text-sm text-neutral-600"><strong>Role:</strong> {user.role}</p>
                        <p className="text-sm text-neutral-600"><strong>Assigned:</strong> {assignedOfficeNames}</p>
                    </div>
                </div>
            )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden hidden md:block">
        <table className="w-full">
          <thead className="bg-neutral-100">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Name</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Email</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Role</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Assigned Offices</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-neutral-200">
                    <td className="p-4 text-neutral-800">{user.name}</td>
                    <td className="p-4 text-neutral-800">{user.email}</td>
                    <td className="p-4 text-neutral-800">{user.role}</td>
                    <td className="p-4 text-sm text-neutral-700">{user.assignedOfficeIds?.map(id => offices.find(o => o.id === id)?.name).join(', ') || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-4">
                        <button onClick={() => openEditModal(user)} className="text-neutral-500 hover:text-blue-600 transition-colors" title="Edit User">
                            <EditIcon className="w-5 h-5" />
                        </button>
                                                <button onClick={() => handleDelete(user.id)} className="text-neutral-500 hover:text-red-600 transition-colors" title="Delete User">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
                                <tr>
                                        <td colSpan={5} className="text-center p-8 text-neutral-500">
                                                {isLoading ? 'Loading users...' : 'No users found matching your criteria.'}
                                        </td>
                                </tr>
            )}
          </tbody>
        </table>
      </div>
       {isModalOpen && <UserForm user={editingUser} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default UserManagementPage;