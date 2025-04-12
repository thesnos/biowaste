import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types/user';
import Sidebar from '../components/Sidebar';
import FactoryAnalytics from '../components/FactoryAnalytics';
import { Bell, CheckCircle2, AlertCircle, Clock, Package } from 'lucide-react';

interface PendingTask {
  id: string;
  type: 'job' | 'order';
  title: string;
  status: string;
  date: string;
  link: string;
}

function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchPendingTasks();
      const interval = setInterval(fetchPendingTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      const tasks: PendingTask[] = [];

      // Fetch jobs
      const jobsResponse = await fetch('http://localhost:5000/api/job-work', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        jobsData.forEach((job: any) => {
          if (
            (user.role === UserRole.MANAGER && job.status === 'completed') ||
            (user.role === UserRole.SUPERVISOR && 
             job.assignedTo.id === user.id && 
             ['pending', 'in_progress'].includes(job.status))
          ) {
            tasks.push({
              id: job._id,
              type: 'job',
              title: `Job ${job.orderId} - ${job.product.name}`,
              status: job.status,
              date: new Date(job.createdAt).toLocaleDateString(),
              link: '/dashboard/job-work'
            });
          }
        });
      }

      // Fetch orders for supervisors
      if (user.role === UserRole.SUPERVISOR) {
        const ordersResponse = await fetch('http://localhost:5000/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          ordersData.forEach((order: any) => {
            if (order.status === 'ordered') {
              tasks.push({
                id: order._id,
                type: 'order',
                title: `Order for ${order.material.name}`,
                status: order.status,
                date: new Date(order.requestDate).toLocaleDateString(),
                link: '/dashboard/orders'
              });
            }
          });
        }
      }

      setPendingTasks(tasks);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'ordered':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  if (!user) return null;

  const isMainDashboard = location.pathname === '/dashboard';

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full">
        <div className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Welcome, {user.name}
            </h1>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <Bell className="h-6 w-6" />
                {pendingTasks.length > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {pendingTasks.length}
                  </span>
                )}
              </button>

              {showNotifications && pendingTasks.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Pending Tasks</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {pendingTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          navigate(task.link);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{task.title}</span>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{task.date}</span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isMainDashboard && <FactoryAnalytics />}

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;