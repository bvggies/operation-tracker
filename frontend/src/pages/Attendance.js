import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { toast } from 'react-toastify';
import { FiClock, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchAttendance();
    } else {
      setLoading(false);
    }
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      setSitesLoading(true);
      // Try to fetch all sites first (new endpoint)
      try {
        const response = await api.get('/projects/sites/all');
        if (response.data && response.data.length > 0) {
          setSites(response.data);
          setSelectedSite(response.data[0].id);
          setSitesLoading(false);
          return;
        }
      } catch (error) {
        console.log('All sites endpoint not available, falling back to project-based fetch');
      }
      
      // Fallback to fetching by project
      const response = await api.get('/projects');
      const allSites = [];
      for (const project of response.data) {
        try {
          const sitesResponse = await api.get(`/projects/${project.id}/sites`);
          if (sitesResponse.data && sitesResponse.data.length > 0) {
            allSites.push(...sitesResponse.data);
          }
        } catch (error) {
          console.error(`Error fetching sites for project ${project.id}:`, error);
        }
      }
      setSites(allSites);
      if (allSites.length > 0) {
        setSelectedSite(allSites[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to fetch sites');
      setLoading(false);
    } finally {
      setSitesLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedSite) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/attendance?site_id=${selectedSite}`);
      setAttendance(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await api.post('/attendance/clock-in', { site_id: selectedSite });
      toast.success('Clocked in successfully');
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.post('/attendance/clock-out', { site_id: selectedSite });
      toast.success('Clocked out successfully');
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clock out');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      half_day: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track worker attendance</p>
        </div>
        {user?.role === 'worker' ? (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClockIn}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <FiClock />
              <span>Clock In</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClockOut}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <FiClock />
              <span>Clock Out</span>
            </motion.button>
          </div>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Site</label>
        {sitesLoading ? (
          <div className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
            Loading sites...
          </div>
        ) : sites.length > 0 ? (
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} {site.project_name ? `(${site.project_name})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-gray-500">No sites available. Please add sites to projects first.</p>
        )}
      </motion.div>

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-64"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance...</p>
          </div>
        </motion.div>
      ) : (
        attendance.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record, index) => (
                    <motion.tr
                      key={record.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.attendance_date ? new Date(record.attendance_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.user_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.clock_in || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.clock_out || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.work_hours ? `${parseFloat(record.work_hours).toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status ? record.status.replace('_', ' ') : '-'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-12 text-center"
          >
            <p className="text-gray-500">No attendance records found</p>
          </motion.div>
        )
      )}
    </motion.div>
  );
};

export default Attendance;

