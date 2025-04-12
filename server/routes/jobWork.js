import express from 'express';
import JobWork from '../models/JobWork.js';
import Product from '../models/Product.js';
import RawMaterial from '../models/RawMaterial.js';
import Inventory from '../models/Inventory.js';
import Wastage from '../models/Wastage.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get all job works
router.get('/', async (req, res) => {
  try {
    const jobs = await JobWork.find()
      .populate('product')
      .populate('assignedTo', 'name username role')
      .populate('createdBy', 'name username role')
      .populate('qualityCheckedBy', 'name username role')
      .sort('-createdAt');
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching job works:', error);
    res.status(500).json({ message: 'Failed to fetch job works', error: error.message });
  }
});

// Create new job work
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, priority, assignedTo, notes } = req.body;

    if (!productId || !quantity || !assignedTo) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: 'Product, quantity, and assigned supervisor are required'
      });
    }

    // Validate product exists
    const product = await Product.findById(productId).populate('materials.material');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if enough materials are available
    for (const materialReq of product.materials) {
      const material = await RawMaterial.findById(materialReq.material);
      if (!material || material.quantity < (materialReq.quantity * quantity)) {
        return res.status(400).json({
          message: `Insufficient quantity of ${material?.name || 'material'}`,
          required: materialReq.quantity * quantity,
          available: material?.quantity || 0
        });
      }
    }

    const newJob = new JobWork({
      product: productId,
      quantity,
      priority: priority || 'medium',
      assignedTo,
      createdBy: req.user._id,
      notes: notes ? [{ content: notes, addedBy: req.user._id }] : []
    });

    await newJob.save();

    const populatedJob = await JobWork.findById(newJob._id)
      .populate('product')
      .populate('assignedTo', 'name username role')
      .populate('createdBy', 'name username role');

    res.status(201).json(populatedJob);
  } catch (error) {
    console.error('Error creating job work:', error);
    res.status(500).json({ 
      message: 'Failed to create job work', 
      error: error.message 
    });
  }
});

// Update job work status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, qualityNotes, wastageQuantity } = req.body;
    const job = await JobWork.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job work not found' });
    }

    job.status = status;

    if (status === 'in_progress') {
      job.startDate = new Date();
      
      // Deduct materials from inventory
      const product = await Product.findById(job.product).populate('materials.material');
      for (const materialReq of product.materials) {
        await RawMaterial.findByIdAndUpdate(
          materialReq.material,
          { $inc: { quantity: -(materialReq.quantity * job.quantity) } }
        );
      }
    }

    if (status === 'completed') {
      job.completionDate = new Date();
    }

    if (status === 'passed' || status === 'rejected') {
      job.qualityCheckDate = new Date();
      job.qualityCheckedBy = req.user._id;
      job.qualityNotes = qualityNotes;

      if (status === 'passed') {
        // Add to factory inventory
        const product = await Product.findById(job.product);
        if (!product) {
          throw new Error('Product not found');
        }

        const existingInventory = await Inventory.findOne({
          type: 'factory',
          product: product._id
        });

        if (existingInventory) {
          existingInventory.quantity += job.quantity;
          existingInventory.lastRestocked = new Date();
          await existingInventory.save();
        } else {
          const factoryInventory = new Inventory({
            type: 'factory',
            name: product.name,
            quantity: job.quantity,
            unit: 'pieces',
            location: 'Factory Storage',
            category: 'Finished Products',
            minimumStock: 0,
            product: product._id,
            createdBy: req.user._id,
            lastRestocked: new Date()
          });
          await factoryInventory.save();
        }

        // Record wastage if any
        if (wastageQuantity > 0) {
          const wastage = new Wastage({
            jobWork: job._id,
            quantity: wastageQuantity,
            reason: qualityNotes || 'Production wastage',
            recordedBy: req.user._id
          });
          await wastage.save();
        }
      } else if (status === 'rejected') {
        // Record wastage
        const wastage = new Wastage({
          jobWork: job._id,
          quantity: wastageQuantity || job.quantity,
          reason: qualityNotes || 'Quality check failure',
          recordedBy: req.user._id
        });
        await wastage.save();

        // Return materials to inventory
        const product = await Product.findById(job.product).populate('materials.material');
        for (const materialReq of product.materials) {
          await RawMaterial.findByIdAndUpdate(
            materialReq.material,
            { $inc: { quantity: materialReq.quantity * job.quantity } }
          );
        }
      }
    }

    await job.save();

    const updatedJob = await JobWork.findById(job._id)
      .populate('product')
      .populate('assignedTo', 'name username role')
      .populate('createdBy', 'name username role')
      .populate('qualityCheckedBy', 'name username role');

    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job work:', error);
    res.status(500).json({ message: 'Failed to update job work', error: error.message });
  }
});

// Add note to job work
router.post('/:id/notes', async (req, res) => {
  try {
    const { content } = req.body;
    const job = await JobWork.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job work not found' });
    }

    job.notes.push({
      content,
      addedBy: req.user._id,
      addedAt: new Date()
    });
    
    await job.save();

    const updatedJob = await JobWork.findById(job._id)
      .populate('product')
      .populate('assignedTo', 'name username role')
      .populate('createdBy', 'name username role')
      .populate('notes.addedBy', 'name username role');

    res.status(201).json(updatedJob);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Failed to add note', error: error.message });
  }
});

export default router;