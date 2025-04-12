import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'job' | 'order' | 'payment' | 'inventory';
  title: string;
  message: string;
  status: string;
  date: string;
  link: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  isOpen,
  onClose,
  onNotificationClick
}) => {
  const getIcon = (type: string, status: string) => {
    switch (type) {
      case 'job':
        return status === 'completed' ? 
          <CheckCircle2 className="h-5 w-5 text-green-500" /> :
          <Clock className="h-5 w-5 text-blue-500" />;
      case 'order':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'payment':
        return status === 'approved' ?
          <CheckCircle2 className="h-5 w-5 text-green-500" /> :
          <Clock className="h-5 w-5 text-blue-500" />;
      case 'inventory':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-primary-50">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {notifications.length > 0 && (
                  <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="h-12 w-12 mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => onNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getIcon(notification.type, notification.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(notification.date), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;