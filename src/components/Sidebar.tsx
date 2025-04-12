import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Warehouse,
  CircleDollarSign,
  Briefcase,
  Users,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  AlertCircle,
  CheckSquare,
  Trash2,
  ArrowRightLeft,
  Store,
  ArrowRight
} from 'lucide-react';
import { UserRole } from '../types/user';

const Sidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingJobs, setPendingJobs] = useState(0);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role as UserRole);
      setUserId(user.id);
    }

    fetchPendingTasks();
    const interval = setInterval(fetchPendingTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch pending orders for supervisors
      if (userRole === UserRole.SUPERVISOR) {
        const ordersResponse = await fetch('http://localhost:5000/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersResponse.json();
        const orderedCount = ordersData.filter((order: any) => 
          order.status === 'ordered'
        ).length;
        setPendingOrders(orderedCount);
      }

      // Fetch jobs based on role
      const jobsResponse = await fetch('http://localhost:5000/api/job-work', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!jobsResponse.ok) throw new Error('Failed to fetch jobs');
      const jobsData = await jobsResponse.json();

      const relevantJobsCount = jobsData.filter((job: any) => {
        if (userRole === UserRole.MANAGER) {
          return job.status === 'completed';
        } else if (userRole === UserRole.SUPERVISOR && userId) {
          return (
            job.assignedTo._id === userId && 
            ['pending', 'in_progress'].includes(job.status)
          );
        }
        return false;
      }).length;

      setPendingJobs(relevantJobsCount);
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const NavLink = ({ to, icon: Icon, children, badge }: { to: string; icon: any; children: React.ReactNode; badge?: number }) => (
    <Link
      to={to}
      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        isActive(to)
          ? 'bg-green-100 text-green-700'
          : 'hover:bg-gray-100'
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <div className="flex items-center">
          <span className="flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1">
            {badge}
          </span>
          <AlertCircle className="h-4 w-4 text-red-500 ml-1" />
        </div>
      )}
    </Link>
  );

  // Check if user can access payments (admin, pro_employee, employee)
  const canAccessPayments = [UserRole.ADMIN, UserRole.PRO_EMPLOYEE, UserRole.EMPLOYEE].includes(userRole as UserRole);

  return (
    <>
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-white shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      <div
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4">
          <div className="flex items-center justify-center mb-8">
            <img src="/logo.png" alt="Logo" className="h-12 w-12" />
          </div>
          
          <nav className="space-y-2">
            <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
            <NavLink to="/dashboard/inventory" icon={Warehouse}>Inventory</NavLink>
            <NavLink to="/dashboard/record-sales" icon={Store}>Record Sales</NavLink>
            <NavLink to="/dashboard/products" icon={Package}>Products</NavLink>
            <NavLink to="/dashboard/raw-materials" icon={Boxes}>Raw Materials</NavLink>
            <NavLink 
              to="/dashboard/orders" 
              icon={ShoppingCart}
              badge={userRole === UserRole.SUPERVISOR ? pendingOrders : undefined}
            >
              Orders
            </NavLink>
            {canAccessPayments && (
              <NavLink to="/dashboard/payments" icon={CircleDollarSign}>Payments</NavLink>
            )}
            <NavLink 
              to="/dashboard/job-work" 
              icon={Briefcase}
              badge={pendingJobs}
            >
              Job Work
            </NavLink>
            {(userRole === UserRole.MANAGER || userRole === UserRole.SUPERVISOR) && (
              <NavLink to="/dashboard/dispatch" icon={ArrowRightLeft}>
                Dispatch
              </NavLink>
            )}
            {userRole === UserRole.MANAGER && (
              <>
                <NavLink to="/dashboard/quality-check" icon={CheckSquare}>
                  Quality Check
                </NavLink>
                <NavLink to="/dashboard/wastage" icon={Trash2}>
                  Wastage Tracking
                </NavLink>
              </>
            )}
            {userRole === UserRole.ADMIN && (
              <NavLink to="/dashboard/users" icon={Users}>Manage Users</NavLink>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;