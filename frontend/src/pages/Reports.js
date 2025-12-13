import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const [progressData, setProgressData] = useState([]);
  const [materialUsage, setMaterialUsage] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [equipmentStatus, setEquipmentStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [progress, materials, attendance, equipment] = await Promise.all([
        api.get('/reports/progress'),
        api.get('/reports/material-usage'),
        api.get('/reports/attendance'),
        api.get('/reports/equipment-status'),
      ]);
      setProgressData(Array.isArray(progress?.data) ? progress.data : []);
      setMaterialUsage(Array.isArray(materials?.data) ? materials.data : []);
      setAttendanceData(Array.isArray(attendance?.data) ? attendance.data : []);
      setEquipmentStatus(Array.isArray(equipment?.data) ? equipment.data : []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setProgressData([]);
      setMaterialUsage([]);
      setAttendanceData([]);
      setEquipmentStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">View detailed reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Task Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed_tasks" fill="#10b981" name="Completed" />
              <Bar dataKey="in_progress_tasks" fill="#3b82f6" name="In Progress" />
              <Bar dataKey="pending_tasks" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Equipment Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={equipmentStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {equipmentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Material Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={materialUsage.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="material_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_used" fill="#8b5cf6" name="Total Used" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.slice(0, 10).map((record) => (
                  <tr key={record.user_id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.user_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.present_days}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.absent_days}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.total_hours ? parseFloat(record.total_hours).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

