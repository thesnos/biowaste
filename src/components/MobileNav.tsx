import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserRole } from '../types/user';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole | null;
  navItems: Array<{
    to: string;
    icon: React.ElementType;
    label: string;
    badge?: number;
    roles?: UserRole[];
  }>;
  onLogout: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  userRole,
  navItems,
  onLogout
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <Link to="/dashboard" className="flex items-center space-x-2" onClick={onClose}>
                <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900">Biowaste Solution</span>
              </Link>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isVisible = !item.roles || item.roles.includes(userRole as UserRole);

                if (!isVisible) return null;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors duration-150"
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-150"
              >
                <span>Logout</span>
              </button>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNav;