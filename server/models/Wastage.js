import mongoose from 'mongoose';

const wastageSchema = new mongoose.Schema({
  jobWork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobWork',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
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
wastageSchema.index({ jobWork: 1 });
wastageSchema.index({ date: -1 });

const Wastage = mongoose.model('Wastage', wastageSchema);
export default Wastage;