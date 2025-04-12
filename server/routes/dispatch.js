import express from 'express';
import Dispatch from '../models/Dispatch.js';
import Inventory from '../models/Inventory.js';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

router.use(auth);

// Get all dispatches
router.get('/', async (req, res) => {
  try {
    const dispatches = await Dispatch.find()
      .populate({
        path: 'items.inventory',
        populate: {
          path: 'product',
          select: 'name size'
        }
      })
      .populate('dispatchedBy', 'name username')
      .populate('receivedBy', 'name username')
      .sort('-createdAt');
    res.json(dispatches);
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    res.status(500).json({ message: 'Failed to fetch dispatches' });
  }
});

// Create new dispatch
router.post('/', async (req, res) => {
  try {
    const { fromType, toType, items, dispatchDate, vehicleNumber, notes } = req.body;

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No items provided for dispatch');
    }

    // Fetch all inventory items in one query with product information
    const inventoryItems = await Inventory.find({
      type: fromType,
      product: { $exists: true }
    }).populate('product');

    // Create inventory map for quick lookup
    const inventoryMap = new Map();
    inventoryItems.forEach(item => {
      // Store with both product ID and inventory ID for flexible lookup
      if (item.product) {
        inventoryMap.set(item.product._id.toString(), item);
      }
      inventoryMap.set(item._id.toString(), item);
    });

    // Validate items and their availability
    const validatedItems = [];
    for (const item of items) {
      // Try to find inventory by both inventory ID and product ID
      let inventory = inventoryMap.get(item.inventory) || 
                     Array.from(inventoryMap.values()).find(inv => 
                       inv.product && inv.product._id.toString() === item.inventory
                     );
      
      if (!inventory) {
        throw new Error(`Inventory item not found for ID: ${item.inventory}`);
      }
      
      if (inventory.type !== fromType) {
        throw new Error(`Item ${inventory.name} is not in ${fromType} inventory`);
      }
      
      if (inventory.quantity < item.quantity) {
        throw new Error(`Insufficient quantity for ${inventory.name} (Available: ${inventory.quantity}, Requested: ${item.quantity})`);
      }

      validatedItems.push({
        inventory: inventory._id,
        quantity: item.quantity
      });
    }

    // Create dispatch record
    const dispatch = new Dispatch({
      fromType,
      toType,
      items: validatedItems,
      dispatchDate: new Date(dispatchDate),
      vehicleNumber,
      notes,
      dispatchedBy: req.user._id,
      status: 'dispatched',
      dispatchedAt: new Date()
    });

    await dispatch.save();

    // Update inventory quantities
    for (const item of validatedItems) {
      const sourceInventory = inventoryMap.get(item.inventory.toString());
      if (!sourceInventory) continue;

      // Update source inventory
      await Inventory.findByIdAndUpdate(
        sourceInventory._id,
        { $inc: { quantity: -item.quantity } }
      );

      // Create or update destination inventory
      const destInventoryQuery = {
        type: toType,
        name: sourceInventory.name,
        unit: sourceInventory.unit || 'pieces',
        location: toType === 'factory' ? 'Factory Storage' : 'Office Storage',
        category: sourceInventory.category || 'Finished Products',
        product: sourceInventory.product
      };

      const existingDestInventory = await Inventory.findOne(destInventoryQuery);

      if (existingDestInventory) {
        await Inventory.findByIdAndUpdate(
          existingDestInventory._id,
          { 
            $inc: { quantity: item.quantity },
            $set: { lastRestocked: new Date() }
          }
        );
      } else {
        const newInventory = new Inventory({
          ...destInventoryQuery,
          quantity: item.quantity,
          minimumStock: sourceInventory.minimumStock || 0,
          createdBy: req.user._id,
          lastRestocked: new Date()
        });
        await newInventory.save();
      }
    }

    const populatedDispatch = await Dispatch.findById(dispatch._id)
      .populate({
        path: 'items.inventory',
        populate: {
          path: 'product',
          select: 'name size'
        }
      })
      .populate('dispatchedBy', 'name username');

    res.status(201).json(populatedDispatch);
  } catch (error) {
    console.error('Error creating dispatch:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update dispatch status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    dispatch.status = status;
    
    if (status === 'received') {
      dispatch.receivedBy = req.user._id;
      dispatch.receivedAt = new Date();
    }

    await dispatch.save();

    const updatedDispatch = await Dispatch.findById(dispatch._id)
      .populate({
        path: 'items.inventory',
        populate: {
          path: 'product',
          select: 'name size'
        }
      })
      .populate('dispatchedBy', 'name username')
      .populate('receivedBy', 'name username');

    res.json(updatedDispatch);
  } catch (error) {
    console.error('Error updating dispatch:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get dispatch statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Dispatch.aggregate([
      {
        $group: {
          _id: null,
          totalDispatches: { $sum: 1 },
          pendingDispatches: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedDispatches: {
            $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get monthly trend
    const monthlyTrend = await Dispatch.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$dispatchDate' },
            month: { $month: '$dispatchDate' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      overall: stats[0] || { totalDispatches: 0, pendingDispatches: 0, completedDispatches: 0 },
      monthlyTrend
    });
  } catch (error) {
    console.error('Error fetching dispatch statistics:', error);
    res.status(500).json({ message: 'Failed to fetch dispatch statistics' });
  }
});

export default router;