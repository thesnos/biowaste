import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema({
  fromType: {
    type: String,
    enum: ['office', 'factory'],
    required: true
  },
  toType: {
    type: String,
    enum: ['office', 'factory'],
    required: true
  },
  items: [{
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  dispatchDate: {
    type: Date,
    required: true
  },
  vehicleNumber: String,
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'received', 'cancelled'],
    default: 'pending'
  },
  dispatchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dispatchedAt: Date,
  receivedAt: Date
}, {
  timestamps: true
});

// Add index for better query performance
dispatchSchema.index({ dispatchDate: -1 });
dispatchSchema.index({ status: 1 });
dispatchSchema.index({ fromType: 1, toType: 1 });

const Dispatch = mongoose.model('Dispatch', dispatchSchema);
export default Dispatch;