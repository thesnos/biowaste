import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalOrders: number;
    activeJobs: number;
    totalEmployees: number;
    pendingApprovals: number;
    revenueChange: number;
    inventoryAlerts: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: Package,
      color: 'bg-blue-500',
      trend: stats.revenueChange > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(stats.revenueChange)}%`
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertTriangle,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              {stat.trend && (
                <div className={`flex items-center ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium ml-1">{stat.trendValue}</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
          <div className={`h-1 ${stat.color}`} />
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;