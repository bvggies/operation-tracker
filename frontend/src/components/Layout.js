import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiCheckSquare,
  FiPackage,
  FiSettings,
  FiBarChart2,
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
  FiClock,
  FiFileText,
  FiShield,
} from 'react-icons/fi';


const Layout = ({ children }) => {
  const { user, logout, isAdmin, isManager, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
      // On desktop, always show sidebar
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = useMemo(() => {
    if (!user || !user.role) return [];
    
    const allItems = [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard', roles: ['admin', 'manager', 'supervisor', 'worker'] },
      { path: '/projects', icon: FiFolder, label: 'Projects', roles: ['admin', 'manager', 'supervisor'] },
      { path: '/tasks', icon: FiCheckSquare, label: 'Tasks', roles: ['admin', 'manager', 'supervisor', 'worker'] },
      { path: '/materials', icon: FiPackage, label: 'Materials', roles: ['admin', 'manager', 'supervisor', 'worker'] },
      { path: '/equipment', icon: FiSettings, label: 'Equipment', roles: ['admin', 'manager', 'supervisor'] },
      { path: '/attendance', icon: FiClock, label: 'Attendance', roles: ['admin', 'manager', 'supervisor', 'worker'] },
      { path: '/reports', icon: FiBarChart2, label: 'Reports', roles: ['admin', 'manager'] },
      { path: '/documents', icon: FiFileText, label: 'Documents', roles: ['admin', 'manager', 'supervisor'] },
      { path: '/users', icon: FiUsers, label: 'Users', roles: ['admin', 'manager'] },
      { path: '/audit', icon: FiShield, label: 'Audit Logs', roles: ['admin', 'manager'] },
    ];
    
    return allItems.filter(item => {
      if (!item || !item.icon || typeof item.icon !== 'function') return false;
      if (!item.roles || !Array.isArray(item.roles)) return false;
      return item.roles.includes(user.role);
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-xl text-blue-600">Operations Tracker</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ${
            isDesktop ? '' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200 hidden lg:block">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <img src="/logo.svg" alt="Logo" className="h-10 w-10" />
                <span className="font-bold text-xl text-blue-600">Operations Tracker</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                {menuItems && Array.isArray(menuItems) && menuItems.length > 0 ? (
                  menuItems.map((item, index) => {
                    if (!item || !item.icon || typeof item.icon !== 'function') return null;
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path || index}>
                        <Link
                          to={item.path || '/dashboard'}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {Icon ? <Icon size={20} /> : null}
                          <span>{item.label || 'Menu'}</span>
                        </Link>
                      </li>
                    );
                  })
                ) : (
                  <li className="px-4 py-3 text-gray-500 text-sm">No menu items available</li>
                )}
              </ul>
            </nav>

            {/* User info */}
            {user ? (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.first_name || ''} {user.last_name || ''}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{user.role || 'user'}</p>
                  </div>
                  <Link
                    to="/notifications"
                    className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <FiBell size={20} />
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiLogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen ? (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        {/* Main content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

