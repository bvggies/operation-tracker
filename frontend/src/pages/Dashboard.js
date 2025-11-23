import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import {
  FiFolder,
  FiMapPin,
  FiCheckSquare,
  FiUsers,
  FiPackage,
  FiSettings,
  FiTrendingUp,
  FiAlertCircle,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
// Recharts imports - commented out for now to avoid errors
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: FiFolder,
      color: 'bg-blue-500',
      link: '/projects',
    },
    {
      title: 'Active Sites',
      value: stats?.activeSites || 0,
      icon: FiMapPin,
      color: 'bg-green-500',
      link: '/projects',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks || 0,
      icon: FiCheckSquare,
      color: 'bg-yellow-500',
      link: '/tasks',
    },
    {
      title: "Today's Attendance",
      value: stats?.todayAttendance || 0,
      icon: FiUsers,
      color: 'bg-purple-500',
      link: '/attendance',
    },
    {
      title: 'Equipment in Maintenance',
      value: stats?.equipmentInMaintenance || 0,
      icon: FiSettings,
      color: 'bg-orange-500',
      link: '/equipment',
    },
    {
      title: 'Low Stock Materials',
      value: stats?.lowStockMaterials || 0,
      icon: FiPackage,
      color: 'bg-red-500',
      link: '/materials',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your operations</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards && statCards.length > 0 ? (
          statCards.map((stat, index) => {
            if (!stat || !stat.icon) return null;
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Link
                  to={stat.link || '/dashboard'}
                  className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title || 'N/A'}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value ?? 0}</p>
                    </div>
                    <div className={`${stat.color || 'bg-gray-500'} p-4 rounded-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">No statistics available</div>
        )}
      </div>

      {/* Recent Tasks */}
      {stats?.recentTasks && Array.isArray(stats.recentTasks) && stats.recentTasks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
            <Link to="/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentTasks.map((task, index) => (
              task ? (
                <motion.div
                  key={task.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{task.title || 'Untitled Task'}</p>
                    <p className="text-sm text-gray-600">{task.site_name || 'No site'}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {task.status ? task.status.replace('_', ' ') : 'Unknown'}
                  </span>
                </motion.div>
              ) : null
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Recent Activities */}
      {stats?.recentActivities && Array.isArray(stats.recentActivities) && stats.recentActivities.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {stats.recentActivities.map((activity, index) => (
              activity ? (
                <motion.div
                  key={activity.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiTrendingUp className="text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.user_name || 'Unknown'} • {activity.site_name || 'No site'} • {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                </motion.div>
              ) : null
            ))}
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default Dashboard;

