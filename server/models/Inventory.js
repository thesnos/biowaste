import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['office', 'factory']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  minimumStock: {
    type: Number,
    default: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
inventorySchema.index({ type: 1 });
inventorySchema.index({ product: 1 });
inventorySchema.index({ createdBy: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;