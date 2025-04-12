import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, XCircle, Package, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types/user';

interface Material {
  id: string;
  name: string;
  quantity: number;
  size: string;
}

interface Order {
  _id: string;
  material: Material;
  requestedQuantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'received';
  requestedBy: User;
  approvedBy?: User;
  requestDate: string;
  approvalDate?: string;
  receivedDate?: string;
  notes?: string;
}

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    materialId: '',
    requestedQuantity: 1,
    notes: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchOrders();
    fetchMaterials();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/raw-materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          materialId: formData.materialId,
          requestedQuantity: formData.requestedQuantity,
          notes: formData.notes || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      setIsModalOpen(false);
      setFormData({ materialId: '', requestedQuantity: 1, notes: '' });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error instanceof Error ? error.message : 'Failed to create order');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredOrders = orders.filter(order =>
    order.material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canRequestOrder = currentUser?.role === UserRole.SUPERVISOR;
  const isSupervisor = currentUser?.role === UserRole.SUPERVISOR;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        {canRequestOrder && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full md:w-auto justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Request Material
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search orders..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Mobile View */}
        <div className="grid grid-cols-1 md:hidden gap-4 p-4">
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {order.material.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Requested by: {order.requestedBy.name}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Quantity:</span> {order.requestedQuantity}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(order.requestDate).toLocaleDateString()}
                </p>
                {order.notes && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {order.notes}
                  </p>
                )}
              </div>

              {((isAdmin && order.status === 'pending') || 
                (isSupervisor && order.status === 'ordered')) && (
                <div className="mt-4 flex gap-2">
                  {isAdmin && order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'approved')}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'rejected')}
                        className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {isAdmin && order.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'ordered')}
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      <span>Mark Ordered</span>
                    </button>
                  )}
                  {isSupervisor && order.status === 'ordered' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'received')}
                      className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      <span>Mark Received</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.material.name} ({order.material.size})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.requestedQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.requestedBy.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(order.requestDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {isAdmin && order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'approved')}
                            className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'rejected')}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      {isAdmin && order.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'ordered')}
                          className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          <span>Mark Ordered</span>
                        </button>
                      )}
                      {isSupervisor && order.status === 'ordered' && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'received')}
                          className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          <span>Mark Received</span>
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Request Raw Material</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Material</label>
                      <select
                        value={formData.materialId}
                        onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      >
                        <option value="">Select a material</option>
                        {materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.size})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.requestedQuantity}
                        onChange={(e) => setFormData({ ...formData, requestedQuantity: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Orders;