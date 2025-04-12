import React, { useState, useEffect } from 'react';
import { Search, Package, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '../types/user';

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

function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'office' | 'factory'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

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

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      (item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
      </div>

      <div className="mb-6 space-y-4">
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-md ${
              selectedType === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType('office')}
            className={`flex items-center px-4 py-2 rounded-md ${
              selectedType === 'office'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building className="h-4 w-4 mr-2" />
            Office
          </button>
          <button
            onClick={() => setSelectedType('factory')}
            className={`flex items-center px-4 py-2 rounded-md ${
              selectedType === 'factory'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="h-4 w-4 mr-2" />
            Factory
          </button>
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
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  item.type === 'factory' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {item.type}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Quantity</p>
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
          </motion.div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Restocked</th>
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
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.type === 'factory' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.product ? `${item.product.name} (${item.product.size})` : item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(item.lastRestocked).toLocaleDateString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Inventory;