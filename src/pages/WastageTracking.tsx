import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Scale, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface WastageRecord {
  _id: string;
  jobWork: {
    orderId: string;
    product: {
      name: string;
    };
  };
  quantity: number;
  reason: string;
  recordedBy: {
    name: string;
  };
  date: string;
}

interface WastageStats {
  overall: {
    totalWastage: number;
    avgWastagePerJob: number;
    count: number;
  };
  monthlyTrend: Array<{
    _id: {
      year: number;
      month: number;
    };
    totalWastage: number;
    count: number;
  }>;
}

function WastageTracking() {
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>([]);
  const [stats, setStats] = useState<WastageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWastageData();
  }, []);

  const fetchWastageData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const [recordsResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/wastage', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wastage/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!recordsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch wastage data');
      }

      const [records, statsData] = await Promise.all([
        recordsResponse.json(),
        statsResponse.json()
      ]);

      setWastageRecords(records);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching wastage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading wastage data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Wastage Tracking</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Wastage</h3>
            <Scale className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats?.overall.totalWastage.toFixed(2)} kg
          </p>
          <p className="text-sm text-gray-500">Across all recorded jobs</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Average per Job</h3>
            <BarChart className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats?.overall.avgWastagePerJob.toFixed(2)} kg
          </p>
          <p className="text-sm text-gray-500">Average wastage per job</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Monthly Trend</h3>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats?.monthlyTrend[0]?.totalWastage.toFixed(2)} kg
          </p>
          <p className="text-sm text-gray-500">Current month's total wastage</p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Monthly Trend</h2>
        <div className="h-64">
          {/* Add a chart library of your choice here to visualize the monthly trend */}
          <div className="flex items-center justify-center h-full text-gray-500">
            Monthly trend visualization will be implemented here
          </div>
        </div>
      </div>

      {/* Wastage Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Wastage Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wastageRecords.map((record) => (
                <tr key={record._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(record.date), 'PPp')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {record.jobWork.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.jobWork.product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.quantity} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.recordedBy.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {record.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WastageTracking;