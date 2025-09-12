import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUsers, FaCalendarAlt, FaChartBar, FaCog, FaExchangeAlt, FaBuilding, FaTable } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import AdminStats from '../components/admin/AdminStats';
import ManageTeachers from '../components/admin/ManageTeachers';
import ManageLeaves from '../components/admin/ManageLeaves';
import ManageSubstitutions from '../components/admin/ManageSubstitutions';
import DepartmentManagement from '../components/admin/DepartmentManagement';
import ClassTimetableManagement from '../components/admin/ClassTimetableManagement';
import AdminProfile from '../components/admin/AdminProfile';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FaChartBar },
    { name: 'Manage Teachers', href: '/admin/teachers', icon: FaUsers },
    { name: 'Manage Leaves', href: '/admin/leaves', icon: FaCalendarAlt },
    { name: 'Manage Substitutions', href: '/admin/substitutions', icon: FaExchangeAlt },
    { name: 'Department Management', href: '/admin/departments', icon: FaBuilding },
    { name: 'Class Timetables', href: '/admin/classes', icon: FaTable },
    { name: 'Profile', href: '/admin/profile', icon: FaCog },
  ];

  const isActiveRoute = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-danger-600 rounded-lg flex items-center justify-center">
              <FaChartBar className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">Admin Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-danger-100 rounded-full flex items-center justify-center">
              <FaCog className="h-5 w-5 text-danger-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActiveRoute(item.href)
                      ? 'bg-danger-100 text-danger-900 border-r-2 border-danger-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      isActiveRoute(item.href) ? 'text-danger-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </a>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<AdminStats />} />
              <Route path="/teachers" element={<ManageTeachers />} />
              <Route path="/leaves" element={<ManageLeaves />} />
              <Route path="/substitutions" element={<ManageSubstitutions />} />
              <Route path="/departments" element={<DepartmentManagement />} />
              <Route path="/classes" element={<ClassTimetableManagement />} />
              <Route path="/profile" element={<AdminProfile />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
