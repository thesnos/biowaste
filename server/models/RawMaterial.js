import mongoose from 'mongoose';

const rawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add index for better query performance
rawMaterialSchema.index({ name: 1 });

const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);
export default RawMaterial;