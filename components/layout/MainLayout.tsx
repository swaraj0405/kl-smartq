
import React, { useState, useCallback, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Role } from '../../types';
import { HomeIcon, TicketIcon, HistoryIcon, LogOutIcon, BarChartIcon, BuildingIcon, UsersIcon, MenuIcon, CloseIcon } from '../common/Icons';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-secondary text-primary-dark font-bold'
          : 'text-neutral-200 hover:bg-primary-light hover:text-white'
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const Sidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { currentUser, logout } = useAppContext();
    const location = useLocation();

    useEffect(() => {
        onClose();
    }, [location.pathname, onClose]);

    const handleLogout = () => {
        onClose();
        logout();
    }

    const renderNavLinks = () => {
        switch (currentUser?.role) {
            case Role.STUDENT:
                return (
                    <>
                        <NavItem to="/dashboard" icon={<HomeIcon className="w-6 h-6" />} label="Dashboard" />
                        <NavItem to="/book-token" icon={<TicketIcon className="w-6 h-6" />} label="Book Token" />
                        <NavItem to="/history" icon={<HistoryIcon className="w-6 h-6" />} label="History" />
                    </>
                );
            case Role.STAFF:
                return (
                    <NavItem to="/dashboard" icon={<HomeIcon className="w-6 h-6" />} label="Queue Dashboard" />
                );
            case Role.ADMIN:
                return (
                    <>
                        <NavItem to="/dashboard" icon={<BarChartIcon className="w-6 h-6" />} label="Analytics" />
                        <NavItem to="/offices" icon={<BuildingIcon className="w-6 h-6" />} label="Offices" />
                        <NavItem to="/users" icon={<UsersIcon className="w-6 h-6" />} label="Users" />
                        <NavItem to="/staff-view" icon={<HomeIcon className="w-6 h-6" />} label="Staff View" />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <aside className="w-64 bg-primary-dark text-white flex flex-col p-4 h-full">
            <div className="flex justify-between items-center py-4 mb-6">
                <h1 className="text-3xl font-bold text-white">KL SmartQ</h1>
                <button onClick={onClose} className="lg:hidden text-white hover:text-secondary" aria-label="Close sidebar">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-grow space-y-2">
                {renderNavLinks()}
            </nav>
            <div>
                 <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-200 hover:bg-red-500 hover:text-white transition-colors duration-200">
                    <LogOutIcon className="w-6 h-6" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};


const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { currentUser } = useAppContext();
    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <div>
                 <button onClick={onMenuClick} className="text-neutral-600 hover:text-primary-dark lg:hidden" aria-label="Open sidebar">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex items-center space-x-3">
                <div className="text-right">
                    <p className="font-semibold text-neutral-800">{currentUser?.name}</p>
                    <p className="text-sm text-neutral-500">{currentUser?.role}</p>
                </div>
                 <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-white font-bold">
                     {currentUser?.name.charAt(0)}
                </div>
            </div>
        </header>
    );
}

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

  return (
    <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">
        {/* Overlay for mobile */}
        {isSidebarOpen && (
            <div 
                onClick={closeSidebar}
                className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                aria-hidden="true"
            ></div>
        )}
      
        {/* Sidebar container */}
        <div 
            className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}
        >
            <Sidebar onClose={closeSidebar} />
        </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={openSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
            {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;