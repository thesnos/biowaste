import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowRightLeft, Truck, Calendar, AlertTriangle, CheckCircle, XCircle, Building, Package, User } from 'lucide-react';
import { format } from 'date-fns';
import { User as UserType, UserRole } from '../types/user';

interface Product {
  id: string;
  name: string;
  size: string;
}

interface InventoryItem {
  _id: string;
  type: 'office' | 'factory';
  name: string;
  quantity: number;
  location: string;
  product: Product;
}

interface DispatchItem {
  inventory: {
    _id: string;
    name: string;
    product: {
      name: string;
      size: string;
    };
  };
  quantity: number;
}

interface DispatchRecord {
  _id: string;
  fromType: 'office' | 'factory';
  toType: 'office' | 'factory';
  items: DispatchItem[];
  dispatchDate: string;
  vehicleNumber?: string;
  notes?: string;
  status: 'pending' | 'dispatched' | 'received' | 'cancelled';
  dispatchedBy: UserType;
  receivedBy?: UserType;
  dispatchedAt: string;
  receivedAt?: string;
}

interface DispatchForm {
  fromType: 'office' | 'factory';
  toType: 'office' | 'factory';
  items: Array<{
    inventory: string;
    quantity: number;
  }>;
  dispatchDate: string;
  vehicleNumber?: string;
  notes?: string;
}

const MobileDispatchCard = ({ 
  dispatch, 
  onAction,
  canReceive 
}: { 
  dispatch: DispatchRecord; 
  onAction: (action: string) => void;
  canReceive: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">
            {format(new Date(dispatch.dispatchDate), 'MMM dd, yyyy')}
          </span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(dispatch.status)}`}>
          {dispatch.status}
        </span>
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex flex-col items-center">
          <Building className="h-6 w-6 text-gray-600" />
          <span className="text-xs font-medium text-gray-600 mt-1 capitalize">{dispatch.fromType}</span>
        </div>
        <ArrowRightLeft className="h-5 w-5 text-gray-400" />
        <div className="flex flex-col items-center">
          <Package className="h-6 w-6 text-gray-600" />
          <span className="text-xs font-medium text-gray-600 mt-1 capitalize">{dispatch.toType}</span>
        </div>
      </div>

      {dispatch.vehicleNumber && (
        <div className="flex items-center space-x-2 mb-3 bg-gray-50 rounded-lg p-2">
          <Truck className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">{dispatch.vehicleNumber}</span>
        </div>
      )}

      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {dispatch.items.map((item, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-700">
                {item.inventory.product?.name || item.inventory.name}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {item.quantity} pcs
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>Dispatched by: {dispatch.dispatchedBy.name}</span>
        </div>
        {dispatch.receivedBy && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Received by: {dispatch.receivedBy.name}</span>
          </div>
        )}
      </div>

      {(dispatch.status === 'dispatched' || dispatch.status === 'pending') && (
        <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
          {dispatch.status === 'dispatched' && canReceive && (
            <button
              onClick={() => onAction('received')}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Mark Received</span>
            </button>
          )}
          {dispatch.status === 'pending' && (
            <button
              onClick={() => onAction('cancelled')}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <XCircle className="h-4 w-4 mr-2" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function Dispatch() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<DispatchForm>({
    fromType: 'factory',
    toType: 'office',
    items: [],
    dispatchDate: format(new Date(), 'yyyy-MM-dd'),
    vehicleNumber: '',
    notes: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role as UserRole);
      setCurrentUser(user);
    }
    fetchProducts();
    fetchInventory();
    fetchDispatches();
  }, []);

  const canReceiveDispatch = (dispatch: DispatchRecord) => {
    if (dispatch.status !== 'dispatched') return false;

    // Factory to Office: Only Employee or Pro Employee can receive
    if (dispatch.fromType === 'factory' && dispatch.toType === 'office') {
      return [UserRole.EMPLOYEE, UserRole.PRO_EMPLOYEE].includes(userRole as UserRole);
    }

    // Office to Factory: Only Supervisor can receive
    if (dispatch.fromType === 'office' && dispatch.toType === 'factory') {
      return userRole === UserRole.SUPERVISOR;
    }

    return false;
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchDispatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dispatch', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch dispatches');
      const data = await response.json();
      setDispatches(data);
    } catch (error) {
      console.error('Error fetching dispatches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.items.length === 0) {
        alert('Please add at least one item to dispatch');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dispatch');
      }

      setIsModalOpen(false);
      setFormData({
        fromType: 'factory',
        toType: 'office',
        items: [],
        dispatchDate: format(new Date(), 'yyyy-MM-dd'),
        vehicleNumber: '',
        notes: ''
      });
      fetchDispatches();
      fetchInventory();
    } catch (error) {
      console.error('Error creating dispatch:', error);
      alert(error instanceof Error ? error.message : 'Failed to create dispatch');
    }
  };

  const handleUpdateStatus = async (dispatchId: string, status: string) => {
    try {
      const dispatch = dispatches.find(d => d._id === dispatchId);
      if (!dispatch) return;

      if (status === 'received' && !canReceiveDispatch(dispatch)) {
        alert('You do not have permission to receive this dispatch');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/dispatch/${dispatchId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update dispatch status');
      }

      fetchDispatches();
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      alert('Failed to update dispatch status');
    }
  };

  const handleAddItem = (inventoryId: string, quantity: number) => {
    if (quantity <= 0) {
      const updatedItems = formData.items.filter(item => item.inventory !== inventoryId);
      setFormData({ ...formData, items: updatedItems });
      return;
    }

    const inventoryItem = inventory.find(item => item._id === inventoryId);
    if (!inventoryItem) {
      console.error('Invalid inventory item');
      return;
    }

    if (quantity > inventoryItem.quantity) {
      alert(`Cannot dispatch more than available quantity (${inventoryItem.quantity})`);
      return;
    }

    const existingItemIndex = formData.items.findIndex(item => item.inventory === inventoryId);
    if (existingItemIndex >= 0) {
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity = quantity;
      setFormData({ ...formData, items: updatedItems });
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, { inventory: inventoryId, quantity }]
      });
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      (item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = item.type === formData.fromType;
    const matchesProduct = !selectedProduct || item.product?.id === selectedProduct;
    return matchesSearch && matchesType && matchesProduct;
  });

  const filteredDispatches = dispatches.filter(dispatch =>
    dispatch.items.some(item =>
      item.inventory.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inventory.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const isManager = userRole === UserRole.MANAGER;
  const isSupervisor = userRole === UserRole.SUPERVISOR;
  const canCreateDispatch = [UserRole.MANAGER, UserRole.SUPERVISOR].includes(userRole as UserRole);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dispatch Management</h1>
        {canCreateDispatch && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Dispatch
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search dispatches..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredDispatches.map((dispatch) => (
          <MobileDispatchCard
            key={dispatch._id}
            dispatch={dispatch}
            onAction={(action) => handleUpdateStatus(dispatch._id, action)}
            canReceive={canReceiveDispatch(dispatch)}
          />
        ))}
      </div>

      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatched By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDispatches.map((dispatch) => (
                <tr key={dispatch._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(dispatch.dispatchDate), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{dispatch.fromType}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{dispatch.toType}</td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside">
                      {dispatch.items.map((item, index) => (
                        <li key={index}>
                          {item.inventory.product?.name || item.inventory.name} - {item.quantity} pcs
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {dispatch.vehicleNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      dispatch.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                      dispatch.status === 'received' ? 'bg-green-100 text-green-800' :
                      dispatch.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dispatch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dispatch.dispatchedBy.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dispatch.receivedBy?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {dispatch.status === 'dispatched' && canReceiveDispatch(dispatch) && (
                      <button
                        onClick={() => handleUpdateStatus(dispatch._id, 'received')}
                        className="flex items-center text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Received
                      </button>
                    )}
                    {dispatch.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(dispatch._id, 'cancelled')}
                        className="flex items-center text-red-600 hover:text-red-900"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Create New Dispatch</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Location</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      fromType: 'factory',
                      toType: 'office'
                    })}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      formData.fromType === 'factory'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <Building className={`h-6 w-6 mx-auto mb-2 ${
                      formData.fromType === 'factory' ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className={`block text-sm font-medium ${
                      formData.fromType === 'factory' ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      Factory
                    </span>
                  </button>

                  <button
                    onClick={() => setFormData({
                      ...formData,
                      fromType: 'office',
                      toType: 'factory'
                    })}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      formData.fromType === 'office'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <Package className={`h-6 w-6 mx-auto mb-2 ${
                      formData.fromType === 'office' ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <span className={`block text-sm font-medium ${
                      formData.fromType === 'office' ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      Office
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-center my-4">
                  <ArrowRightLeft className="h-6 w-6 text-gray-400" />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <span className="text-sm text-gray-600">
                    Dispatching to: <span className="font-medium capitalize">{formData.toType}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={formData.dispatchDate}
                    onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="Enter vehicle number"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Items
                </label>
                <div className="space-y-3">
                  {filteredInventory.map((item) => (
                    <div 
                      key={item._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-700">
                          {item.product?.name || item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Available: {item.quantity}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={formData.items.find(i => i.inventory === item._id)?.quantity || ''}
                        onChange={(e) => handleAddItem(item._id, parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-1 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dispatch;