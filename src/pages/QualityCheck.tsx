import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { User, UserRole } from '../types/user';
import { motion, AnimatePresence } from 'framer-motion';

interface JobWork {
  _id: string;
  orderId: string;
  product: {
    name: string;
    size: string;
  };
  quantity: number;
  status: string;
  assignedTo: User;
  completionDate: string;
}

interface QualityCheckForm {
  notes: string;
  wastageQuantity: number;
  wastageReason: string;
  passedQuantity: number;
}

const MobileJobCard = ({ 
  job, 
  onQualityCheck 
}: { 
  job: JobWork; 
  onQualityCheck: (job: JobWork) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{job.orderId}</h3>
          <p className="text-sm text-gray-500">
            {job.product.name} ({job.product.size})
          </p>
        </div>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {job.status}
        </span>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Quantity:</span> {job.quantity}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Completed By:</span> {job.assignedTo.name}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Completion Date:</span>{' '}
          {format(new Date(job.completionDate), 'PPp')}
        </p>
      </div>

      <div className="mt-4">
        <button
          onClick={() => onQualityCheck(job)}
          className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Perform QC
        </button>
      </div>
    </div>
  );
};

function QualityCheck() {
  const [jobs, setJobs] = useState<JobWork[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWork | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('completed');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<QualityCheckForm>({
    notes: '',
    wastageQuantity: 0,
    wastageReason: '',
    passedQuantity: 0
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role as UserRole);
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/job-work', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.filter((job: JobWork) => job.status === 'completed'));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to fetch jobs');
    }
  };

  const handleQualityCheck = async (jobId: string, status: 'passed' | 'rejected') => {
    try {
      if (status === 'passed' && formData.passedQuantity <= 0) {
        alert('Please enter valid passed quantity');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/job-work/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          qualityNotes: formData.notes,
          wastageQuantity: status === 'rejected' ? selectedJob?.quantity : formData.wastageQuantity,
          wastageReason: formData.wastageReason,
          passedQuantity: status === 'passed' ? formData.passedQuantity : 0
        })
      });

      if (!response.ok) throw new Error('Failed to update job status');

      setSelectedJob(null);
      setFormData({
        notes: '',
        wastageQuantity: 0,
        wastageReason: '',
        passedQuantity: 0
      });
      fetchJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job status');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (userRole !== UserRole.MANAGER) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-600">Only managers can access the quality check page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quality Check</h1>

      <div className="mb-6 space-y-4">
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-auto rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="passed">Passed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredJobs.map((job) => (
          <MobileJobCard
            key={job._id}
            job={job}
            onQualityCheck={setSelectedJob}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <tr key={job._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{job.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {job.product.name} ({job.product.size})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{job.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{job.assignedTo.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(job.completionDate), 'PPp')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Perform QC
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quality Check Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full"
            >
              <h2 className="text-lg font-medium mb-4">Quality Check - {selectedJob.orderId}</h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Job Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p><strong>Product:</strong> {selectedJob.product.name}</p>
                  <p><strong>Total Quantity:</strong> {selectedJob.quantity}</p>
                  <p><strong>Completed By:</strong> {selectedJob.assignedTo.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quality Check Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    rows={3}
                    placeholder="Enter quality check notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Passed Quantity</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedJob.quantity}
                    value={formData.passedQuantity}
                    onChange={(e) => {
                      const value = Math.min(parseInt(e.target.value), selectedJob.quantity);
                      setFormData({
                        ...formData,
                        passedQuantity: value
                      });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Wastage Quantity (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.wastageQuantity}
                    onChange={(e) => setFormData({
                      ...formData,
                      wastageQuantity: parseFloat(e.target.value) || 0
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Wastage Reason</label>
                  <textarea
                    value={formData.wastageReason}
                    onChange={(e) => setFormData({ ...formData, wastageReason: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    rows={2}
                    placeholder="Enter reason for wastage..."
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      setFormData({
                        notes: '',
                        wastageQuantity: 0,
                        wastageReason: '',
                        passedQuantity: 0
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleQualityCheck(selectedJob._id, 'rejected')}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject All
                  </button>
                  <button
                    onClick={() => handleQualityCheck(selectedJob._id, 'passed')}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Pass
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QualityCheck;