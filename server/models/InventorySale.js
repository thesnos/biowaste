import mongoose from 'mongoose';

const inventorySaleSchema = new mongoose.Schema({
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
inventorySaleSchema.index({ inventory: 1 });
inventorySaleSchema.index({ date: -1 });
inventorySaleSchema.index({ platform: 1 });
inventorySaleSchema.index({ recordedBy: 1 });

const InventorySale = mongoose.model('InventorySale', inventorySaleSchema);
export default InventorySale;