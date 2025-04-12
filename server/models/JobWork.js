import mongoose from 'mongoose';

const jobWorkSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'quality_check', 'passed', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: Date,
  completionDate: Date,
  qualityCheckDate: Date,
  qualityCheckedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  qualityNotes: String
}, {
  timestamps: true
});

// Generate orderId before validation
jobWorkSchema.pre('validate', async function(next) {
  try {
    if (!this.orderId) {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      
      // Find the latest job work
      const lastJob = await this.constructor.findOne({}, {}, { sort: { orderId: -1 } });
      
      let counter = 1;
      if (lastJob && lastJob.orderId) {
        const lastNumber = parseInt(lastJob.orderId.split('-')[2]);
        if (!isNaN(lastNumber)) {
          counter = lastNumber + 1;
        }
      }
      
      this.orderId = `JW-${currentYear}${currentMonth}-${counter.toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const JobWork = mongoose.model('JobWork', jobWorkSchema);
export default JobWork;