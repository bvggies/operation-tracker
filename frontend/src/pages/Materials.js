import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { toast } from 'react-toastify';
import { FiPlus, FiPackage, FiAlertCircle } from 'react-icons/fi';

const Materials = () => {
  const [inventory, setInventory] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [formData, setFormData] = useState({
    material_id: '',
    quantity: '',
    delivery_date: new Date().toISOString().split('T')[0],
    supplier: '',
  });

  useEffect(() => {
    fetchMaterials();
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchInventory();
    }
  }, [selectedSite]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      toast.error('Failed to fetch materials');
    }
  };

  const fetchSites = async () => {
    try {
      const response = await api.get('/projects');
      const allSites = [];
      for (const project of response.data) {
        const sitesResponse = await api.get(`/projects/${project.id}/sites`);
        allSites.push(...sitesResponse.data);
      }
      setSites(allSites);
      if (allSites.length > 0) {
        setSelectedSite(allSites[0].id);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchInventory = async () => {
    if (!selectedSite) return;
    setLoading(true);
    try {
      const response = await api.get(`/materials/inventory/${selectedSite}`);
      setInventory(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelivery = async (e) => {
    e.preventDefault();
    try {
      await api.post('/materials/deliveries', {
        ...formData,
        site_id: selectedSite,
        quantity: parseFloat(formData.quantity),
      });
      toast.success('Delivery recorded successfully');
      setShowDeliveryModal(false);
      setFormData({ material_id: '', quantity: '', delivery_date: new Date().toISOString().split('T')[0], supplier: '' });
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record delivery');
    }
  };

  const handleUsage = async (e) => {
    e.preventDefault();
    try {
      await api.post('/materials/usage', {
        ...formData,
        site_id: selectedSite,
        quantity: parseFloat(formData.quantity),
      });
      toast.success('Usage recorded successfully');
      setShowUsageModal(false);
      setFormData({ material_id: '', quantity: '', delivery_date: new Date().toISOString().split('T')[0], supplier: '' });
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record usage');
    }
  };

  const handleRequisition = async (e) => {
    e.preventDefault();
    try {
      await api.post('/materials/requisitions', {
        material_id: formData.material_id,
        site_id: selectedSite,
        quantity: parseFloat(formData.quantity),
      });
      toast.success('Requisition created successfully');
      setShowRequisitionModal(false);
      setFormData({ material_id: '', quantity: '', delivery_date: new Date().toISOString().split('T')[0], supplier: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create requisition');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials</h1>
          <p className="text-gray-600 mt-1">Track material inventory and usage</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDeliveryModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FiPlus />
            <span>Record Delivery</span>
          </button>
          <button
            onClick={() => setShowUsageModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FiPackage />
            <span>Record Usage</span>
          </button>
          <button
            onClick={() => setShowRequisitionModal(true)}
            className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            <FiPlus />
            <span>Request Material</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Site</label>
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-sm p-6 ${
                parseFloat(item.quantity) <= parseFloat(item.min_threshold)
                  ? 'border-2 border-red-300'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{item.material_name}</h3>
                  {parseFloat(item.quantity) <= parseFloat(item.min_threshold) && (
                    <div className="flex items-center text-red-600 text-sm mt-1">
                      <FiAlertCircle className="mr-1" />
                      Low Stock
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-bold text-gray-900">
                    {parseFloat(item.quantity).toFixed(2)} {item.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Threshold:</span>
                  <span className="text-gray-900">
                    {parseFloat(item.min_threshold).toFixed(2)} {item.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <Modal
          title="Record Delivery"
          onClose={() => setShowDeliveryModal(false)}
          onSubmit={handleDelivery}
          formData={formData}
          setFormData={setFormData}
          materials={materials}
          showSupplier={true}
        />
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <Modal
          title="Record Usage"
          onClose={() => setShowUsageModal(false)}
          onSubmit={handleUsage}
          formData={formData}
          setFormData={setFormData}
          materials={materials}
          showSupplier={false}
        />
      )}

      {/* Requisition Modal */}
      {showRequisitionModal && (
        <Modal
          title="Request Material"
          onClose={() => setShowRequisitionModal(false)}
          onSubmit={handleRequisition}
          formData={formData}
          setFormData={setFormData}
          materials={materials}
          showSupplier={false}
        />
      )}
    </div>
  );
};

const Modal = ({ title, onClose, onSubmit, formData, setFormData, materials, showSupplier }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <select
              value={formData.material_id}
              onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {showSupplier && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.delivery_date}
              onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Materials;

