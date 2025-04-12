import React, { useState, useEffect } from 'react';
import { Plus, Search, Play, CheckCircle, MessageSquare, X, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types/user';

interface Product {
  id: string;
  name: string;
  size: string;
}

interface JobWork {
  _id: string;
  orderId: string;
  product: Product;
  quantity: number;
  status: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo: {
    _id: string;
    name: string;
    role: string;
  };
  createdBy: User;
  startDate?: string;
  completionDate?: string;
  notes: Array<{
    content: string;
    addedBy: User;
    addedAt: string;
  }>;
}

const MobileJobCard = ({ job, onAction }: { job: JobWork; onAction: (action: string) => void }) => {
  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      passed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{job.orderId}</h3>
          <p className="text-sm text-gray-500">{job.product.name} ({job.product.size})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={getStatusBadge(job.status)}>
            {job.status.replace('_', ' ')}
          </span>
          <span className={getPriorityBadge(job.priority)}>
            {job.priority}
          </span>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Quantity:</span> {job.quantity}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Assigned To:</span> {job.assignedTo.name}
        </p>
        {job.startDate && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Started:</span> {new Date(job.startDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.status === 'pending' && (
          <button
            onClick={() => onAction('start')}
            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            <Play className="h-4 w-4 mr-1" />
            <span>Start Work</span>
          </button>
        )}
        {job.status === 'in_progress' && (
          <button
            onClick={() => onAction('complete')}
            className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Complete</span>
          </button>
        )}
        <button
          onClick={() => onAction('notes')}
          className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>Notes</span>
        </button>
      </div>
    </div>
  );
};

function JobWork() {
  const [jobs, setJobs] = useState<JobWork[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWork | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    priority: 'medium' as const,
    assignedTo: '',
    notes: ''
  });
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch user data');
        return response.json();
      })
      .then(data => {
        setCurrentUser(data);
        setUserRole(data.role);
      })
      .catch(error => {
        console.error('Error fetching user role:', error);
      });
    }
    fetchJobs();
    fetchProducts();
    fetchUsers();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/job-work', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
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
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      const supervisors = data.filter((user: User) => user.role === UserRole.SUPERVISOR);
      setUsers(supervisors);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/job-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: formData.productId,
          quantity: formData.quantity,
          priority: formData.priority,
          assignedTo: formData.assignedTo,
          notes: formData.notes || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create job');
      }

      setIsModalOpen(false);
      setFormData({
        productId: '',
        quantity: 1,
        priority: 'medium',
        assignedTo: '',
        notes: ''
      });
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      alert(error instanceof Error ? error.message : 'Failed to create job');
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/job-work/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      fetchJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job status');
    }
  };

  const addNote = async (jobId: string) => {
    if (!newNote.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/job-work/${jobId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newNote.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const updatedJob = await response.json();
      setNewNote('');
      setSelectedJob(updatedJob);
      setJobs(jobs.map(job => job._id === jobId ? updatedJob : job));
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isManager = userRole === UserRole.MANAGER;
  const isSupervisor = userRole === UserRole.SUPERVISOR;

  const canStartWork = (job: JobWork) => {
    return isSupervisor && 
           job.status === 'pending' && 
           job.assignedTo._id === currentUser?._id;
  };

  const canCompleteWork = (job: JobWork) => {
    return isSupervisor && 
           job.status === 'in_progress' && 
           job.assignedTo._id === currentUser?._id;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderActionButtons = (job: JobWork) => (
    <div className="flex items-center space-x-2">
      {canStartWork(job) && (
        <button
          onClick={() => updateJobStatus(job._id, 'in_progress')}
          className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
        >
          <Play className="h-4 w-4 mr-1" />
          <span>Start Work</span>
        </button>
      )}
      {canCompleteWork(job) && (
        <button
          onClick={() => updateJobStatus(job._id, 'completed')}
          className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          <span>Complete</span>
        </button>
      )}
      <button
        onClick={() => {
          setSelectedJob(job);
          setIsNotesModalOpen(true);
        }}
        className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        <span>Notes</span>
      </button>
    </div>
  );

  const handleJobAction = (jobId: string, action: string) => {
    switch (action) {
      case 'start':
        updateJobStatus(jobId, 'in_progress');
        break;
      case 'complete':
        updateJobStatus(jobId, 'completed');
        break;
      case 'notes':
        const job = jobs.find(j => j._id === jobId);
        if (job) {
          setSelectedJob(job);
          setIsNotesModalOpen(true);
        }
        break;
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Job Work Management</h1>
        {isManager && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Job Work
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search jobs..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredJobs.map((job) => (
          <MobileJobCard
            key={job._id}
            job={job}
            onAction={(action) => handleJobAction(job._id, action)}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{job.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.product.name} ({job.product.size})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{job.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      <span className="ml-1">{job.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{job.assignedTo.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {renderActionButtons(job)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Create New Job Work</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.size})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  <option value="">Select a supervisor</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
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
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {isNotesModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Job Notes - {selectedJob.orderId}</h2>
              <button
                onClick={() => {
                  setIsNotesModalOpen(false);
                  setSelectedJob(null);
                  setNewNote('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Job Details</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p><strong>Product:</strong> {selectedJob.product.name}</p>
                <p><strong>Status:</strong> {selectedJob.status}</p>
                {selectedJob.startDate && (
                  <p><strong>Started:</strong> {new Date(selectedJob.startDate).toLocaleString()}</p>
                )}
                {selectedJob.completionDate && (
                  <p><strong>Completed:</strong> {new Date(selectedJob.completionDate).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
              {selectedJob.notes.map((note, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-700">{note.addedBy.name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(note.addedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600">{note.content}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (newNote.trim()) {
                      addNote(selectedJob._id);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobWork;