import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: true
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'ordered', 'received'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: Date,
  receivedDate: Date,
  notes: String
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;