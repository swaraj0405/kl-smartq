import React from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { Role } from './types';

// Layout and Auth
import MainLayout from './components/layout/MainLayout';
import StudentAuthPage from './components/auth/StudentAuthPage';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import BookTokenPage from './components/student/BookTokenPage';
import TokenHistoryPage from './components/student/TokenHistoryPage';

// Staff Components
import StaffDashboard from './components/staff/StaffDashboard';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import OfficeManagementPage from './components/admin/OfficeManagementPage';
import UserManagementPage from './components/admin/UserManagementPage';

const App: React.FC = () => {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return <StudentAuthPage />;
  }

  const renderRoutes = () => {
    switch (currentUser.role) {
      case Role.STUDENT:
        return (
          <Routes>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/book-token" element={<BookTokenPage />} />
            <Route path="/history" element={<TokenHistoryPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        );
      case Role.STAFF:
        return (
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        );
      case Role.ADMIN:
        return (
          <Routes>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/offices" element={<OfficeManagementPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/staff-view" element={<StaffDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        );
      default:
        return <Navigate to="/" />;
    }
  };

  return (
    <HashRouter>
      <MainLayout>
        {renderRoutes()}
      </MainLayout>
    </HashRouter>
  );
};

export default App;