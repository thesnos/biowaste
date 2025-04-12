import express from 'express';
import Order from '../models/Order.js';
import RawMaterial from '../models/RawMaterial.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware
router.use(auth);

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('material')
      .populate('requestedBy', 'name username role')
      .populate('approvedBy', 'name username role')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new order request
router.post('/', async (req, res) => {
  try {
    const { materialId, requestedQuantity, notes } = req.body;

    // Validate material exists
    const material = await RawMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const newOrder = new Order({
      material: materialId,
      requestedQuantity,
      notes,
      requestedBy: req.user._id,
      requestDate: new Date()
    });

    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('material')
      .populate('requestedBy', 'name username role')
      .populate('approvedBy', 'name username role');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.status = status;

    // Handle approval/rejection
    if (status === 'approved' || status === 'rejected') {
      order.approvedBy = req.user._id;
      order.approvalDate = new Date();
    }

    // Handle receiving order
    if (status === 'received') {
      order.receivedDate = new Date();
      
      // Update material quantity
      await RawMaterial.findByIdAndUpdate(
        order.material,
        { $inc: { quantity: order.requestedQuantity } }
      );
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('material')
      .populate('requestedBy', 'name username role')
      .populate('approvedBy', 'name username role');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;