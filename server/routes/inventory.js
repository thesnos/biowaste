import express from 'express';
import Inventory from '../models/Inventory.js';
import InventorySale from '../models/InventorySale.js';
import InventoryReturn from '../models/InventoryReturn.js';
import auth from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

router.use(auth);

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find()
      .populate('product')
      .populate('createdBy', 'name username')
      .sort('-createdAt');
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Failed to fetch inventory', error: error.message });
  }
});

// Get inventory items by type (office/factory)
router.get('/type/:type', async (req, res) => {
  try {
    const items = await Inventory.find({ type: req.params.type })
      .populate('product')
      .populate('createdBy', 'name username')
      .sort('-createdAt');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inventory by type', error: error.message });
  }
});

// Record a sale
router.post('/:id/sale', async (req, res) => {
  try {
    // Check if user has permission
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.PRO_EMPLOYEE, UserRole.EMPLOYEE].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to record sales' });
    }

    const { platform, quantity, notes } = req.body;
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (quantity > inventory.quantity) {
      return res.status(400).json({ message: 'Insufficient quantity available' });
    }

    // Create sale record
    const sale = new InventorySale({
      inventory: inventory._id,
      platform,
      quantity,
      notes,
      recordedBy: req.user._id
    });

    // Update inventory quantity
    inventory.quantity -= quantity;
    
    await Promise.all([
      sale.save(),
      inventory.save()
    ]);

    const populatedSale = await InventorySale.findById(sale._id)
      .populate('inventory')
      .populate('recordedBy', 'name username');

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ message: 'Failed to record sale', error: error.message });
  }
});

// Record a return
router.post('/:id/return', async (req, res) => {
  try {
    // Check if user has permission
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.PRO_EMPLOYEE, UserRole.EMPLOYEE].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to record returns' });
    }

    const { platform, quantity, reason, notes } = req.body;
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if this is an office inventory item
    if (inventory.type !== 'office') {
      return res.status(400).json({ message: 'Returns can only be recorded for office inventory' });
    }

    // Create return record
    const returnRecord = new InventoryReturn({
      inventory: inventory._id,
      platform,
      quantity,
      reason,
      notes,
      recordedBy: req.user._id
    });

    // Update inventory quantity
    inventory.quantity += quantity;
    
    await Promise.all([
      returnRecord.save(),
      inventory.save()
    ]);

    const populatedReturn = await InventoryReturn.findById(returnRecord._id)
      .populate('inventory')
      .populate('recordedBy', 'name username');

    res.status(201).json(populatedReturn);
  } catch (error) {
    console.error('Error recording return:', error);
    res.status(500).json({ message: 'Failed to record return', error: error.message });
  }
});

// Get sales history
router.get('/sales', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      InventorySale.find()
        .populate({
          path: 'inventory',
          populate: {
            path: 'product',
            select: 'name size'
          }
        })
        .populate('recordedBy', 'name')
        .sort('-date')
        .skip(skip)
        .limit(limit),
      InventorySale.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      sales,
      currentPage: page,
      totalPages,
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales history', error: error.message });
  }
});

// Get returns history
router.get('/returns', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      InventoryReturn.find()
        .populate({
          path: 'inventory',
          populate: {
            path: 'product',
            select: 'name size'
          }
        })
        .populate('recordedBy', 'name')
        .sort('-date')
        .skip(skip)
        .limit(limit),
      InventoryReturn.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      returns,
      currentPage: page,
      totalPages,
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch returns history', error: error.message });
  }
});

export default router;