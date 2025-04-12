import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft, IndianRupee, AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { User, UserRole } from '../types/user';
import { generatePaymentStatement } from '../utils/pdfGenerator';
import PaymentCard from '../components/PaymentCard';

interface Payment {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description?: string;
  requestedBy: {
    name: string;
    role: string;
  };
  receivedBy?: {
    name: string;
    role: string;
  };
  createdAt: string;
}

interface UserBalance {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  balance: number;
}

interface EligibleUser {
  id: string;
  name: string;
  username: string;
  role: string;
}

function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date().setDate(1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [formData, setFormData] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal',
    amount: '',
    description: ''
  });

  const [transferFormData, setTransferFormData] = useState({
    userId: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role as UserRole);
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchPayments();
    }
  }, [userRole]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !userRole) return;

      const endpoint = userRole === UserRole.ADMIN ? '/api/payments' : '/api/payments/my';
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();

      if (userRole === UserRole.ADMIN) {
        setPayments(data.payments);
        setUserBalances(data.userBalances);
        setEligibleUsers(data.eligibleUsers || []);
      } else {
        setPayments(data.payments);
        setCurrentBalance(data.balance);
        setEligibleUsers(data.eligibleUsers || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment request');
      }

      setIsModalOpen(false);
      setFormData({ type: 'deposit', amount: '', description: '' });
      fetchPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to create payment request');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'transfer',
          userId: transferFormData.userId,
          amount: parseFloat(transferFormData.amount),
          description: transferFormData.description || 'Transfer payment'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create transfer');
      }

      setIsTransferModalOpen(false);
      setTransferFormData({ userId: '', amount: '', description: '' });
      fetchPayments();
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert(error instanceof Error ? error.message : 'Failed to create transfer');
    }
  };

  const handleUpdateStatus = async (paymentId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`http://localhost:5000/api/payments/${paymentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update payment status');

      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment status');
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.userId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(balanceAmount) })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      setIsAddBalanceModalOpen(false);
      setSelectedUser(null);
      setBalanceAmount('');
      fetchPayments();
    } catch (error) {
      console.error('Error adding balance:', error);
      alert(error instanceof Error ? error.message : 'Failed to add balance');
    }
  };

  const handleDownloadStatement = () => {
    const filteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return paymentDate >= start && paymentDate <= end;
    });

    const doc = generatePaymentStatement(filteredPayments, dateRange.startDate, dateRange.endDate);
    doc.save(`payment_statement_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
    setIsPdfModalOpen(false);
  };

  const filteredPayments = payments.filter(payment => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      payment.type.toLowerCase().includes(searchStr) ||
      payment.status.toLowerCase().includes(searchStr) ||
      payment.requestedBy.name.toLowerCase().includes(searchStr) ||
      (payment.description?.toLowerCase().includes(searchStr) ?? false);
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesType = filterType === 'all' || payment.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const isAdmin = userRole === UserRole.ADMIN;
  const canRequestPayment = [UserRole.PRO_EMPLOYEE, UserRole.EMPLOYEE].includes(userRole as UserRole);

  if (![UserRole.ADMIN, UserRole.PRO_EMPLOYEE, UserRole.EMPLOYEE].includes(userRole as UserRole)) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-600">You do not have permission to access the payments page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          {!isAdmin && (
            <p className="text-gray-600 mt-1">
              Your Balance: <span className="font-semibold text-green-600">₹{currentBalance.toFixed(2)}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          {canRequestPayment && (
            <>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Request Payment
              </button>
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <ArrowRightLeft className="h-5 w-5 mr-2" />
                Transfer
              </button>
            </>
          )}
          {isAdmin && (
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Statement
            </button>
          )}
        </div>
      </div>

      {isAdmin && userBalances.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">User Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {userBalances.map((user) => (
              <div key={user.userId} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.role}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-5 w-5 text-gray-400" />
                    {[UserRole.EMPLOYEE, UserRole.PRO_EMPLOYEE].includes(user.role as UserRole) && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setBalanceAmount('');
                          setIsAddBalanceModalOpen(true);
                        }}
                        className="p-1 text-green-600 hover:text-green-900 rounded-full hover:bg-green-50"
                        title="Add Balance"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xl font-semibold text-gray-900">₹{user.balance.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search payments..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="transfer">Transfers</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredPayments.map((payment) => (
          <PaymentCard
            key={payment._id}
            payment={payment}
            onAction={(action) => handleUpdateStatus(payment._id, action)}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isAdmin ? 'Requested By' : 'Received By'}
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <tr key={payment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {payment.type === 'deposit' && <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />}
                    {payment.type === 'withdrawal' && <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />}
                    {payment.type === 'transfer' && <ArrowRightLeft className="h-4 w-4 text-purple-500 mr-1" />}
                    <span className="capitalize">{payment.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${
                    payment.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ₹{payment.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isAdmin ? payment.requestedBy.name : payment.receivedBy?.name || '-'}
                  <span className="text-xs text-gray-500 block">
                    {isAdmin ? payment.requestedBy.role : payment.receivedBy?.role || '-'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {payment.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(payment._id, 'approved')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(payment._id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {payment.status === 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(payment._id, 'completed')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PDF Download Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Download Payment Statement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadStatement}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Request Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'deposit' | 'withdrawal' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter payment description..."
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
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Transfer Money</h2>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Recipient</label>
                <select
                  value={transferFormData.userId}
                  onChange={(e) => setTransferFormData({ ...transferFormData, userId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="">Select a recipient</option>
                  {eligibleUsers
                    .filter(user => user.id !== currentUser?._id)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={currentBalance}
                    value={transferFormData.amount}
                    onChange={(e) => setTransferFormData({ ...transferFormData, amount: e.target.value })}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Available balance: ₹{currentBalance.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={transferFormData.description}
                  onChange={(e) => setTransferFormData({ ...transferFormData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter transfer description..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  Transfer Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Balance Modal */}
      {isAddBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Add Balance for {selectedUser.name}</h3>
            <form onSubmit={handleAddBalance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Current balance: ₹{selectedUser.balance.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddBalanceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Add Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;