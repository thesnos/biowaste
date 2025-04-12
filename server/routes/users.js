import express from 'express';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import bcrypt from 'bcryptjs';
import auth from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

// Apply auth middleware
router.use(auth);

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Only admin can create users' });
    }

    const { name, username, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({
      name,
      username,
      password,
      role
    });

    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Only admin can update users' });
    }

    const { name, username, role, password } = req.body;
    const updateData = { name, username, role };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Only admin can delete users' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Add balance to user
router.post('/:id/balance', async (req, res) => {
  try {
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Only admin can add balance' });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is employee or pro employee
    if (![UserRole.EMPLOYEE, UserRole.PRO_EMPLOYEE].includes(user.role)) {
      return res.status(400).json({ message: 'Can only add balance to employees and pro employees' });
    }

    // Add balance
    user.balance += amount;
    await user.save();

    // Create a payment record for this transaction
    const payment = new Payment({
      type: 'deposit',
      amount,
      status: 'completed',
      requestedBy: user._id,
      approvedBy: req.user._id,
      description: 'Balance added by admin',
      approvalDate: new Date(),
      completionDate: new Date()
    });
    await payment.save();

    res.json({
      message: 'Balance added successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Error adding balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;