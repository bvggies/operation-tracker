import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiUsers, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'active',
  });
  const [siteFormData, setSiteFormData] = useState({
    name: '',
    address: '',
    supervisor_id: '',
    status: 'active',
  });

  useEffect(() => {
    if (user && selectedProject && selectedProject.id && typeof isAdmin === 'function' && typeof isManager === 'function') {
      try {
        if (isAdmin() || isManager()) {
          fetchSites(selectedProject.id);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    }
  }, [selectedProject, user, isAdmin, isManager]);

  useEffect(() => {
    fetchProjects();
    if (user && typeof isAdmin === 'function' && typeof isManager === 'function') {
      try {
        if (isAdmin() || isManager()) {
          fetchSupervisors();
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    }
  }, [user, isAdmin, isManager]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      const projectsData = Array.isArray(response.data) ? response.data : [];
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/sites`);
      const sitesData = Array.isArray(response.data) ? response.data : [];
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to fetch sites');
      setSites([]);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/users');
      const usersData = Array.isArray(response.data) ? response.data : [];
      const supervisorsList = usersData.filter(
        (u) => u && u.role && ['admin', 'manager', 'supervisor'].includes(u.role) && u.active
      );
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      setSupervisors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', formData);
        toast.success('Project created successfully');
      }
      
      // Close modal and reset form first
      setShowModal(false);
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        status: 'active',
      });
      
      // Refresh data after a short delay to ensure state updates are complete
      setTimeout(async () => {
        try {
          await fetchProjects();
        } catch (error) {
          console.error('Error refreshing projects:', error);
        }
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      location: project.location || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status,
    });
    setShowModal(true);
  };

  const handleAddSite = (project) => {
    setSelectedProject(project);
    setEditingSite(null);
    setSiteFormData({
      name: '',
      address: '',
      supervisor_id: '',
      status: 'active',
    });
    setShowSiteModal(true);
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    setSiteFormData({
      name: site.name,
      address: site.address || '',
      supervisor_id: site.supervisor_id || '',
      status: site.status,
    });
    setShowSiteModal(true);
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error('No project selected');
      return;
    }

    try {
      // Prepare data - convert empty supervisor_id to null
      const submitData = {
        ...siteFormData,
        supervisor_id: siteFormData.supervisor_id && siteFormData.supervisor_id.trim() !== '' 
          ? siteFormData.supervisor_id 
          : null,
      };

      const projectId = selectedProject.id;
      
      if (editingSite) {
        await api.put(`/projects/sites/${editingSite.id}`, submitData);
        toast.success('Site updated successfully');
      } else {
        await api.post(`/projects/${projectId}/sites`, submitData);
        toast.success('Site created successfully');
      }
      
      // Close modal and reset form first
      setShowSiteModal(false);
      setEditingSite(null);
      setSiteFormData({
        name: '',
        address: '',
        supervisor_id: '',
        status: 'active',
      });
      
      // Refresh data after a short delay to ensure state updates are complete
      setTimeout(async () => {
        try {
          await fetchProjects();
          // Update selectedProject to match the new projects list
          try {
            const updatedProjectsResponse = await api.get('/projects');
            const updatedProjects = Array.isArray(updatedProjectsResponse.data) ? updatedProjectsResponse.data : [];
            const updatedProject = updatedProjects.find(p => p && p.id === projectId);
            if (updatedProject) {
              setSelectedProject(updatedProject);
              await fetchSites(projectId);
            } else {
              // Project not found, clear selection
              setSelectedProject(null);
              setSites([]);
            }
          } catch (refreshError) {
            console.error('Error refreshing project data:', refreshError);
            // Clear selection on error
            setSelectedProject(null);
            setSites([]);
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Error submitting site:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Operation failed';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage construction projects and sites</p>
        </div>
        {user && typeof isAdmin === 'function' && typeof isManager === 'function' && (isAdmin() || isManager()) ? (
          <button
            onClick={() => {
              setEditingProject(null);
              setFormData({
                name: '',
                description: '',
                location: '',
                start_date: '',
                end_date: '',
                status: 'active',
              });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FiPlus />
            <span>New Project</span>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects && Array.isArray(projects) && projects.length > 0 ? (
          projects.map((project, index) => (
            project ? (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex space-x-2">
                {user && typeof isAdmin === 'function' && typeof isManager === 'function' && (isAdmin() || isManager()) ? (
                  <>
                    <button
                      onClick={() => handleAddSite(project)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Add Site"
                    >
                      <FiPlus />
                    </button>
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Edit Project"
                    >
                      <FiEdit />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {project.description ? (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
            ) : null}
            {project.location ? (
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <FiMapPin className="mr-2" />
                {project.location}
              </div>
            ) : null}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <FiUsers className="mr-2" />
                {project.site_count || 0} sites
              </div>
              {user && typeof isAdmin === 'function' && typeof isManager === 'function' && (isAdmin() || isManager()) ? (
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    fetchSites(project.id);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  View Sites
                </button>
              ) : null}
            </div>
            {selectedProject && selectedProject.id && project && project.id && selectedProject.id === project.id && sites && Array.isArray(sites) && sites.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sites:</h4>
                <div className="space-y-2">
                  {sites.map((site) => (
                    site && site.id ? (
                      <div key={site.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{site.name || 'Unnamed Site'}</p>
                          {site.address ? (
                            <p className="text-xs text-gray-500">{site.address}</p>
                          ) : null}
                        </div>
                        {user && site && typeof isAdmin === 'function' && typeof isManager === 'function' && (isAdmin() || isManager()) ? (
                          <button
                            onClick={() => handleEditSite(site)}
                            className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                          >
                            <FiEdit size={14} />
                          </button>
                        ) : null}
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            ) : null}
          </div>
            ) : null
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No projects found. Create your first project to get started.</p>
          </div>
        )}
      </div>

      {showModal ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Site Modal */}
      {showSiteModal && selectedProject ? (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowSiteModal(false);
            setEditingSite(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSite ? 'Edit Site' : 'Add Site'}
                </h2>
                <button
                  onClick={() => {
                    setShowSiteModal(false);
                    setEditingSite(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Project: {selectedProject.name}</p>
              <form onSubmit={handleSiteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={siteFormData.name}
                    onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={siteFormData.address}
                    onChange={(e) => setSiteFormData({ ...siteFormData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                  <select
                    value={siteFormData.supervisor_id}
                    onChange={(e) => setSiteFormData({ ...siteFormData, supervisor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supervisor (Optional)</option>
                    {supervisors && supervisors.length > 0 ? (
                      supervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.first_name || ''} {supervisor.last_name || ''} ({supervisor.role || 'user'})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No supervisors available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={siteFormData.status}
                    onChange={(e) => setSiteFormData({ ...siteFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingSite ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSiteModal(false);
                      setEditingSite(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Projects;

