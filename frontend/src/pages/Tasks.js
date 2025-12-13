import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiCheck, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SafeMotion from '../utils/motion';
import { AnimatePresence as FramerAnimatePresence } from 'framer-motion';

const motion = SafeMotion;
const AnimatePresence = FramerAnimatePresence || (({ children }) => <>{children}</>);

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    site_id: '',
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
  });
  const [updateData, setUpdateData] = useState({
    progress_percentage: 0,
    notes: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchTasks();
    fetchSites();
    if (user?.role !== 'worker') {
      fetchWorkers();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      const tasksData = Array.isArray(response.data) ? response.data : [];
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await api.get('/projects');
      const projectsData = Array.isArray(response?.data) ? response.data : [];
      const allSites = [];
      for (const project of projectsData) {
        const sitesResponse = await api.get(`/projects/${project.id}/sites`);
        if (sitesResponse?.data && Array.isArray(sitesResponse.data)) {
          allSites.push(...sitesResponse.data);
        }
      }
      setSites(allSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/users');
      const usersData = Array.isArray(response?.data) ? response.data : [];
      setWorkers(usersData.filter((u) => u && u.role === 'worker' && u.is_active));
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      toast.success('Task created successfully');
      setShowModal(false);
      setFormData({
        site_id: '',
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      // Delay refresh to ensure modal is closed
      setTimeout(() => {
        fetchTasks();
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        status: updateData.status,
        progress_percentage: updateData.progress_percentage,
        notes: updateData.notes,
      });
      if (updateData.notes || updateData.progress_percentage) {
        await api.post(`/tasks/${selectedTask.id}/updates`, {
          progress_percentage: updateData.progress_percentage,
          notes: updateData.notes,
        });
      }
      toast.success('Task updated successfully');
      setShowUpdateModal(false);
      setSelectedTask(null);
      // Delay refresh to ensure modal is closed
      setTimeout(() => {
        fetchTasks();
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track tasks</p>
        </div>
        {user?.role !== 'worker' ? (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
          <FiPlus />
          <span>New Task</span>
        </button>
        ) : null}
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {tasks && Array.isArray(tasks) && tasks.length > 0 ? (
          tasks.map((task, index) => (
            task ? (
          <motion.div
            key={task.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ x: 5, transition: { duration: 0.2 } }}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description ? (
                  <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                ) : null}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Site: {task.site_name || 'No site'}</span>
                  {task.assigned_to_name ? <span>Assigned to: {task.assigned_to_name}</span> : null}
                  {task.due_date ? (
                    <span className="flex items-center">
                      <FiClock className="mr-1" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
              {(user?.role !== 'worker' || task.assigned_to === user?.id) ? (
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setUpdateData({
                      progress_percentage: 0,
                      notes: '',
                      status: task.status,
                    });
                    setShowUpdateModal(true);
                  }}
                  className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <FiEdit />
                </button>
              ) : null}
            </div>
          </motion.div>
            ) : null
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No tasks found. Create your first task to get started.</p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select worker</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.first_name} {worker.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showUpdateModal && selectedTask ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowUpdateModal(false);
              setSelectedTask(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-2xl w-full p-6"
            >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Task</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress ({updateData.progress_percentage}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={updateData.progress_percentage}
                  onChange={(e) => setUpdateData({ ...updateData, progress_percentage: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add update notes..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default Tasks;

