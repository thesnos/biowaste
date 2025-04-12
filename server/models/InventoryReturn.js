import mongoose from 'mongoose';

const inventoryReturnSchema = new mongoose.Schema({
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  platform: {
    type: String,
    enum: ['amazon', 'flipkart', 'website', 'merchant'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
inventoryReturnSchema.index({ inventory: 1 });
inventoryReturnSchema.index({ date: -1 });
inventoryReturnSchema.index({ platform: 1 });
inventoryReturnSchema.index({ recordedBy: 1 });

const InventoryReturn = mongoose.model('InventoryReturn', inventoryReturnSchema);
export default InventoryReturn;