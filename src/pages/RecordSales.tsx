import React, { useState, useEffect } from 'react';
import { Search, Store, AlertTriangle, Package, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types/user';
import { format } from 'date-fns';

interface Product {
  _id: string;
  name: string;
  size: string;
}

interface InventoryItem {
  _id: string;
  type: 'office' | 'factory';
  name: string;
  quantity: number;
  location: string;
  minimumStock: number;
  lastRestocked: string;
  product?: Product;
  createdBy: User;
}

interface SaleFormData {
  platform: 'amazon' | 'flipkart' | 'website' | 'merchant';
  quantity: number;
  notes: string;
}

interface ReturnFormData {
  platform: 'amazon' | 'flipkart' | 'website' | 'merchant';
  quantity: number;
  reason: string;
  notes: string;
}

interface SaleLog {
  _id: string;
  inventory: {
    name: string;
    product?: {
      name: string;
      size: string;
    };
  };
  platform: string;
  quantity: number;
  notes?: string;
  recordedBy: {
    name: string;
  };
  date: string;
}

interface ReturnLog {
  _id: string;
  inventory: {
    name: string;
    product?: {
      name: string;
      size: string;
    };
  };
  platform: string;
  quantity: number;
  reason: string;
  notes?: string;
  recordedBy: {
    name: string;
  };
  date: string;
}

function RecordSales() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [salesLogs, setSalesLogs] = useState<SaleLog[]>([]);
  const [returnsLogs, setReturnsLogs] = useState<ReturnLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    platform: 'amazon',
    quantity: 1,
    notes: ''
  });
  const [returnFormData, setReturnFormData] = useState<ReturnFormData>({
    platform: 'amazon',
    quantity: 1,
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role as UserRole);
    }
    fetchInventory();
    fetchLogs();
  }, [currentPage]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('Failed to fetch inventory');
    }
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const [salesResponse, returnsResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/inventory/sales?page=${currentPage}&limit=${itemsPerPage}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/inventory/returns?page=${currentPage}&limit=${itemsPerPage}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!salesResponse.ok || !returnsResponse.ok) {
        throw new Error('Failed to fetch logs');
      }

      const [salesData, returnsData] = await Promise.all([
        salesResponse.json(),
        returnsResponse.json()
      ]);

      setSalesLogs(salesData.sales);
      setReturnsLogs(returnsData.returns);
      setTotalPages(Math.max(salesData.totalPages, returnsData.totalPages));
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/inventory/${selectedItem._id}/sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saleFormData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record sale');
      }

      setIsSaleModalOpen(false);
      setSelectedItem(null);
      setSaleFormData({
        platform: 'amazon',
        quantity: 1,
        notes: ''
      });
      fetchInventory();
      fetchLogs();
    } catch (error) {
      console.error('Error recording sale:', error);
      alert(error instanceof Error ? error.message : 'Failed to record sale');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/inventory/${selectedItem._id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(returnFormData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record return');
      }

      setIsReturnModalOpen(false);
      setSelectedItem(null);
      setReturnFormData({
        platform: 'amazon',
        quantity: 1,
        reason: '',
        notes: ''
      });
      fetchInventory();
      fetchLogs();
    } catch (error) {
      console.error('Error recording return:', error);
      alert(error instanceof Error ? error.message : 'Failed to record return');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      (item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && item.type === 'office';
  });

  if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.PRO_EMPLOYEE, UserRole.EMPLOYEE].includes(userRole as UserRole)) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-600">You do not have permission to record sales or returns.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Record Sales & Returns</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search inventory..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 md:hidden gap-4">
        {filteredInventory.map((item) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {item.product ? `${item.product.name} (${item.product.size})` : item.name}
                </h3>
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Office
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-lg font-semibold text-gray-900">{item.quantity}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Location:</span> {item.location}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Last Restocked:</span>{' '}
                {new Date(item.lastRestocked).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedItem(item);
                  setSaleFormData({
                    platform: 'amazon',
                    quantity: 1,
                    notes: ''
                  });
                  setIsSaleModalOpen(true);
                }}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Store className="h-5 w-5 mr-2" />
                Record Sale
              </button>
              <button
                onClick={() => {
                  setSelectedItem(item);
                  setReturnFormData({
                    platform: 'amazon',
                    quantity: 1,
                    reason: '',
                    notes: ''
                  });
                  setIsReturnModalOpen(true);
                }}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Record Return
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Restocked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <motion.tr
                key={item._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.product ? `${item.product.name} (${item.product.size})` : item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(item.lastRestocked).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setSaleFormData({
                          platform: 'amazon',
                          quantity: 1,
                          notes: ''
                        });
                        setIsSaleModalOpen(true);
                      }}
                      className="flex items-center text-green-600 hover:text-green-900"
                    >
                      <Store className="h-5 w-5 mr-1" />
                      Record Sale
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setReturnFormData({
                          platform: 'amazon',
                          quantity: 1,
                          reason: '',
                          notes: ''
                        });
                        setIsReturnModalOpen(true);
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-900"
                    >
                      <RotateCcw className="h-5 w-5 mr-1" />
                      Record Return
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sales and Returns Logs */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales & Returns Log</h2>
        
        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {[...salesLogs, ...returnsLogs]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((log) => (
              <div key={log._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {'reason' in log ? 'Return' : 'Sale'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {log.inventory.product 
                        ? `${log.inventory.product.name} (${log.inventory.product.size})`
                        : log.inventory.name}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    'reason' in log ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {log.platform}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Quantity:</span> {log.quantity}</p>
                  <p><span className="font-medium">Recorded By:</span> {log.recordedBy.name}</p>
                  <p><span className="font-medium">Date:</span> {format(new Date(log.date), 'PPp')}</p>
                  {'reason' in log && (
                    <p><span className="font-medium">Reason:</span> {log.reason}</p>
                  )}
                  {log.notes && (
                    <p><span className="font-medium">Notes:</span> {log.notes}</p>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...salesLogs, ...returnsLogs]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        'reason' in log ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {'reason' in log ? 'Return' : 'Sale'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.inventory.product 
                        ? `${log.inventory.product.name} (${log.inventory.product.size})`
                        : log.inventory.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.platform}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.recordedBy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(log.date), 'PPp')}
                    </td>
                    <td className="px-6 py-4">
                      {'reason' in log && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {log.reason}
                        </p>
                      )}
                      {log.notes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {log.notes}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Sale Modal */}
      <AnimatePresence>
        {isSaleModalOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
              onClick={() => setIsSaleModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Record Sale - {selectedItem.product ? selectedItem.product.name : selectedItem.name}
                  </h2>
                  <form onSubmit={handleSaleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Platform</label>
                      <select
                        value={saleFormData.platform}
                        onChange={(e) => setSaleFormData({ ...saleFormData, platform: e.target.value as SaleFormData['platform'] })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      >
                        <option value="amazon">Amazon</option>
                        <option value="flipkart">Flipkart</option>
                        <option value="website">Website</option>
                        <option value="merchant">Merchant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedItem.quantity}
                        value={saleFormData.quantity}
                        onChange={(e) => setSaleFormData({ ...saleFormData, quantity: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Available: {selectedItem.quantity}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={saleFormData.notes}
                        onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        rows={3}
                        placeholder="Enter any additional notes..."
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsSaleModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Record Sale
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Return Modal */}
      <AnimatePresence>
        {isReturnModalOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
              onClick={() => setIsReturnModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Record Return - {selectedItem.product ? selectedItem.product.name : selectedItem.name}
                  </h2>
                  <form onSubmit={handleReturnSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Platform</label>
                      <select
                        value={returnFormData.platform}
                        onChange={(e) => setReturnFormData({ ...returnFormData, platform: e.target.value as ReturnFormData['platform'] })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      >
                        <option value="amazon">Amazon</option>
                        <option value="flipkart">Flipkart</option>
                        <option value="website">Website</option>
                        <option value="merchant">Merchant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={returnFormData.quantity}
                        onChange={(e) => setReturnFormData({ ...returnFormData, quantity: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Return Reason</label>
                      <textarea
                        value={returnFormData.reason}
                        onChange={(e) => setReturnFormData({ ...returnFormData, reason: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        rows={2}
                        placeholder="Enter reason for return..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                      <textarea
                        value={returnFormData.notes}
                        onChange={(e) => setReturnFormData({ ...returnFormData, notes: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        rows={2}
                        placeholder="Enter any additional notes..."
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsReturnModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Record Return
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

export default RecordSales;