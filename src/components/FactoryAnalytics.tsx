import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Package, TrendingUp, AlertTriangle, Filter, Search, IndianRupee, Truck, Trash2 } from 'lucide-react';
import { UserRole } from '../types/user';
import { format } from 'date-fns';

interface AnalyticsData {
  totalJobsToday: number;
  avgProductionTime: number;
  avgQualityCheckTime: number;
  productionCapacity: number;
  qualityIssueRate: number;
}

interface TaskLog {
  id: string;
  type: 'job' | 'order' | 'payment' | 'dispatch' | 'wastage';
  title: string;
  status: string;
  date: string;
  completedBy?: string;
  duration?: number;
  notes?: string;
  amount?: number;
  quantity?: number;
}

const FactoryAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalJobsToday: 0,
    avgProductionTime: 0,
    avgQualityCheckTime: 0,
    productionCapacity: 0,
    qualityIssueRate: 0
  });
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'job' | 'order'>('all');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role as UserRole);
    }
    fetchAnalytics();
    if (userRole === UserRole.ADMIN) {
      fetchTaskLogs();
    }
    const interval = setInterval(() => {
      fetchAnalytics();
      if (userRole === UserRole.ADMIN) {
        fetchTaskLogs();
      }
    }, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [userRole]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/job-work', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const jobs = await response.json();
      
      // Calculate today's metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysJobs = jobs.filter((job: any) => 
        new Date(job.createdAt) >= today
      );

      const completedJobs = jobs.filter((job: any) => 
        job.status === 'completed' || job.status === 'passed' || job.status === 'rejected'
      );

      // Calculate average production time (in hours)
      const productionTimes = completedJobs
        .filter((job: any) => job.startDate && job.completionDate)
        .map((job: any) => {
          const start = new Date(job.startDate);
          const end = new Date(job.completionDate);
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        });

      const avgProdTime = productionTimes.length > 0
        ? productionTimes.reduce((a: number, b: number) => a + b, 0) / productionTimes.length
        : 0;

      // Calculate average quality check time (in hours)
      const qualityTimes = completedJobs
        .filter((job: any) => job.completionDate && job.qualityCheckDate)
        .map((job: any) => {
          const start = new Date(job.completionDate);
          const end = new Date(job.qualityCheckDate);
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        });

      const avgQCTime = qualityTimes.length > 0
        ? qualityTimes.reduce((a: number, b: number) => a + b, 0) / qualityTimes.length
        : 0;

      // Calculate quality issue rate
      const rejectedJobs = completedJobs.filter((job: any) => job.status === 'rejected');
      const qualityIssueRate = completedJobs.length > 0
        ? (rejectedJobs.length / completedJobs.length) * 100
        : 0;

      // Estimate daily production capacity based on completed jobs
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const last30DaysJobs = completedJobs.filter((job: any) => 
        new Date(job.completionDate) >= last30Days
      );

      const avgDailyCapacity = last30DaysJobs.length > 0
        ? last30DaysJobs.reduce((sum: number, job: any) => sum + job.quantity, 0) / 30
        : 0;

      setAnalytics({
        totalJobsToday: todaysJobs.length,
        avgProductionTime: Number(avgProdTime.toFixed(2)),
        avgQualityCheckTime: Number(avgQCTime.toFixed(2)),
        productionCapacity: Math.round(avgDailyCapacity),
        qualityIssueRate: Number(qualityIssueRate.toFixed(2))
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchTaskLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all types of records
      const [jobsResponse, ordersResponse, paymentsResponse, dispatchResponse, wastageResponse] = await Promise.all([
        fetch('http://localhost:5000/api/job-work', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/payments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/dispatch', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wastage', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!jobsResponse.ok || !ordersResponse.ok || !paymentsResponse.ok || !dispatchResponse.ok || !wastageResponse.ok) {
        throw new Error('Failed to fetch task logs');
      }

      const [jobs, orders, payments, dispatches, wastages] = await Promise.all([
        jobsResponse.json(),
        ordersResponse.json(),
        paymentsResponse.json(),
        dispatchResponse.json(),
        wastageResponse.json()
      ]);

      // Transform all records into TaskLog format
      const jobLogs: TaskLog[] = jobs.map((job: any) => ({
        id: job._id,
        type: 'job',
        title: `Job ${job.orderId} - ${job.product.name}`,
        status: job.status,
        date: new Date(job.createdAt).toLocaleString(),
        completedBy: job.completionDate ? job.assignedTo.name : undefined,
        duration: job.completionDate && job.startDate ? 
          (new Date(job.completionDate).getTime() - new Date(job.startDate).getTime()) / (1000 * 60 * 60) : 
          undefined,
        notes: job.qualityNotes
      }));

      const orderLogs: TaskLog[] = orders.map((order: any) => ({
        id: order._id,
        type: 'order',
        title: `Order for ${order.material.name}`,
        status: order.status,
        date: new Date(order.requestDate).toLocaleString(),
        completedBy: order.approvedBy?.name,
        notes: order.notes,
        quantity: order.requestedQuantity
      }));

      const paymentLogs: TaskLog[] = payments.payments.map((payment: any) => ({
        id: payment._id,
        type: 'payment',
        title: `${payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} Payment`,
        status: payment.status,
        date: new Date(payment.createdAt).toLocaleString(),
        completedBy: payment.approvedBy?.name,
        notes: payment.description,
        amount: payment.amount
      }));

      const dispatchLogs: TaskLog[] = dispatches.map((dispatch: any) => ({
        id: dispatch._id,
        type: 'dispatch',
        title: `Dispatch from ${dispatch.fromType} to ${dispatch.toType}`,
        status: dispatch.status,
        date: new Date(dispatch.dispatchDate).toLocaleString(),
        completedBy: dispatch.receivedBy?.name,
        notes: dispatch.notes,
        quantity: dispatch.items.reduce((total: number, item: any) => total + item.quantity, 0)
      }));

      const wastageLogs: TaskLog[] = wastages.map((wastage: any) => ({
        id: wastage._id,
        type: 'wastage',
        title: `Wastage Record - ${wastage.jobWork.product.name}`,
        status: 'recorded',
        date: new Date(wastage.date).toLocaleString(),
        completedBy: wastage.recordedBy.name,
        notes: wastage.reason,
        quantity: wastage.quantity
      }));

      // Combine and sort all logs
      setTaskLogs([
        ...jobLogs,
        ...orderLogs,
        ...paymentLogs,
        ...dispatchLogs,
        ...wastageLogs
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (error) {
      console.error('Error fetching task logs:', error);
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
      case 'ordered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = taskLogs.filter(log => {
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = log.title.toLowerCase().includes(searchStr) ||
                         log.status.toLowerCase().includes(searchStr) ||
                         (log.completedBy?.toLowerCase().includes(searchStr) || false);
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Today's Jobs</h3>
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{analytics.totalJobsToday}</p>
          <p className="text-sm text-gray-500">Total jobs started today</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Avg. Production Time</h3>
            <Clock className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{analytics.avgProductionTime}h</p>
          <p className="text-sm text-gray-500">Average time to complete a job</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Avg. QC Time</h3>
            <CheckCircle2 className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{analytics.avgQualityCheckTime}h</p>
          <p className="text-sm text-gray-500">Average quality check duration</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Daily Capacity</h3>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{analytics.productionCapacity}</p>
          <p className="text-sm text-gray-500">Average units per day</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Quality Issues</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{analytics.qualityIssueRate}%</p>
          <p className="text-sm text-gray-500">Rejection rate</p>
        </div>
      </div>

      {/* Task Logs Section - Only visible for admin */}
      {userRole === UserRole.ADMIN && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Task Logs</h2>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'job' | 'order')}
                  className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Types</option>
                  <option value="job">Jobs</option>
                  <option value="order">Orders</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="passed">Passed</option>
                  <option value="rejected">Rejected</option>
                  <option value="ordered">Ordered</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.type === 'job' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'order' ? 'bg-purple-100 text-purple-800' :
                        log.type === 'payment' ? 'bg-green-100 text-green-800' :
                        log.type === 'dispatch' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.type === 'payment' && log.amount && (
                        <span className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {log.amount.toFixed(2)}
                        </span>
                      )}
                      {(log.type === 'order' || log.type === 'dispatch' || log.type === 'wastage') && log.quantity && (
                        <span className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {log.quantity} units
                        </span>
                      )}
                      {log.type === 'job' && log.duration && (
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {log.duration.toFixed(2)}h
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.completedBy || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryAnalytics;