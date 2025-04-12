import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types/user';

interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  size: string;
}

interface MaterialRequirement {
  material: RawMaterial;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  size: string;
  materials: MaterialRequirement[];
}

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    materials: [] as MaterialRequirement[]
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role as UserRole);
    }
    fetchMaterials();
    fetchProducts();
  }, []);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/raw-materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : 'http://localhost:5000/api/products';
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ name: '', size: '', materials: [] });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleMaterialChange = (materialId: string, quantity: number) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const existingMaterialIndex = formData.materials.findIndex(
      m => m.material.id === materialId
    );

    if (existingMaterialIndex >= 0) {
      const updatedMaterials = [...formData.materials];
      if (quantity > 0) {
        updatedMaterials[existingMaterialIndex] = { material, quantity };
      } else {
        updatedMaterials.splice(existingMaterialIndex, 1);
      }
      setFormData({ ...formData, materials: updatedMaterials });
    } else if (quantity > 0) {
      setFormData({
        ...formData,
        materials: [...formData.materials, { material, quantity }]
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.size.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', size: '', materials: [] });
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full md:w-auto justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Materials</th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.size}</td>
                <td className="px-6 py-4">
                  <ul className="list-disc list-inside">
                    {product.materials.map((req, index) => (
                      <li key={index}>
                        {req.material.name} - {req.quantity} units
                      </li>
                    ))}
                  </ul>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          name: product.name,
                          size: product.size,
                          materials: product.materials
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
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
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Size</label>
                      <input
                        type="text"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Required Materials</label>
                      <div className="space-y-2">
                        {materials.map((material) => (
                          <div key={material.id} className="flex items-center space-x-2">
                            <span className="flex-grow">{material.name}</span>
                            <input
                              type="number"
                              min="0"
                              value={formData.materials.find(m => m.material.id === material.id)?.quantity || ''}
                              onChange={(e) => handleMaterialChange(material.id, parseInt(e.target.value) || 0)}
                              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                        ))}
                      </div>
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
                        {editingProduct ? 'Update' : 'Create'}
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

export default Products;