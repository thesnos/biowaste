import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'transfer']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  description: String,
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  completionDate: Date
}, {
  timestamps: true
});

// Add indexes for better query performance
paymentSchema.index({ requestedBy: 1 });
paymentSchema.index({ receivedBy: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;