import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, IndianRupee, Plus } from 'lucide-react';
import { format } from 'date-fns';

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

interface PaymentCardProps {
  payment: Payment;
  onAction?: (action: string) => void;
  isAdmin?: boolean;
  onAddBalance?: () => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ payment, onAction, isAdmin, onAddBalance }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeIcon = () => {
    switch (payment.type) {
      case 'deposit':
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowDownRight className="h-5 w-5 text-red-500" />;
      case 'transfer':
        return <ArrowRightLeft className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getTypeIcon()}
          <span className="font-medium capitalize">{payment.type}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
            {payment.status}
          </span>
          {isAdmin && onAddBalance && (
            <button
              onClick={onAddBalance}
              className="p-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
              title="Add Balance"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600">Amount</span>
        <span className={`text-lg font-semibold ${payment.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
          <IndianRupee className="h-4 w-4 inline-block" />
          {payment.amount.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Requested By:</span> {payment.requestedBy.name}
          <span className="text-xs text-gray-500 ml-1">({payment.requestedBy.role})</span>
        </p>
        {payment.receivedBy && (
          <p>
            <span className="font-medium">Received By:</span> {payment.receivedBy.name}
            <span className="text-xs text-gray-500 ml-1">({payment.receivedBy.role})</span>
          </p>
        )}
        <p>
          <span className="font-medium">Date:</span> {format(new Date(payment.createdAt), 'PPp')}
        </p>
        {payment.description && (
          <p>
            <span className="font-medium">Description:</span> {payment.description}
          </p>
        )}
      </div>

      {isAdmin && payment.status === 'pending' && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onAction?.('approved')}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          >
            Approve
          </button>
          <button
            onClick={() => onAction?.('rejected')}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Reject
          </button>
        </div>
      )}
      {isAdmin && payment.status === 'approved' && (
        <button
          onClick={() => onAction?.('completed')}
          className="mt-4 w-full px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
        >
          Complete
        </button>
      )}
    </div>
  );
};

export default PaymentCard;