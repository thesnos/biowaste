import express from 'express';
import Wastage from '../models/Wastage.js';
import JobWork from '../models/JobWork.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get all wastage records
router.get('/', async (req, res) => {
  try {
    const wastages = await Wastage.find()
      .populate({
        path: 'jobWork',
        populate: {
          path: 'product',
          select: 'name size'
        }
      })
      .populate('recordedBy', 'name username')
      .sort('-date');
    res.json(wastages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch wastage records', error: error.message });
  }
});

// Create new wastage record
router.post('/', async (req, res) => {
  try {
    const { jobWorkId, quantity, reason } = req.body;

    // Validate job work exists
    const jobWork = await JobWork.findById(jobWorkId);
    if (!jobWork) {
      return res.status(404).json({ message: 'Job work not found' });
    }

    const wastage = new Wastage({
      jobWork: jobWorkId,
      quantity,
      reason,
      recordedBy: req.user._id
    });

    await wastage.save();

    const populatedWastage = await Wastage.findById(wastage._id)
      .populate({
        path: 'jobWork',
        populate: {
          path: 'product',
          select: 'name size'
        }
      })
      .populate('recordedBy', 'name username');

    res.status(201).json(populatedWastage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create wastage record', error: error.message });
  }
});

// Get wastage statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Wastage.aggregate([
      {
        $group: {
          _id: null,
          totalWastage: { $sum: '$quantity' },
          avgWastagePerJob: { $avg: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly trend
    const monthlyTrend = await Wastage.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalWastage: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      overall: stats[0] || { totalWastage: 0, avgWastagePerJob: 0, count: 0 },
      monthlyTrend
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch wastage statistics', error: error.message });
  }
});

export default router;