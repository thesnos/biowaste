import express from 'express';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

router.use(auth);

// Get all payments for the current user
router.get('/my', async (req, res) => {
  try {
    // Get current user with balance
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payments = await Payment.find({ 
      $or: [
        { requestedBy: req.user._id },
        { receivedBy: req.user._id }
      ]
    })
    .populate('requestedBy', 'name username role')
    .populate('receivedBy', 'name username role')
    .populate('approvedBy', 'name username')
    .sort('-createdAt');

    // Get eligible users for transfers
    const eligibleUsers = await User.find({
      _id: { $ne: req.user._id },
      role: { $in: [UserRole.EMPLOYEE, UserRole.PRO_EMPLOYEE, UserRole.ADMIN] }
    })
    .select('name username role')
    .sort('name');

    res.json({
      payments,
      balance: user.balance || 0,
      eligibleUsers: eligibleUsers.map(user => ({
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payments and eligible users (admin only)
router.get('/', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Access denied. Only admin can view all payments.' });
    }

    // Get all payments
    const payments = await Payment.find()
      .populate('requestedBy', 'name username role')
      .populate('receivedBy', 'name username role')
      .populate('approvedBy', 'name username')
      .sort('-createdAt');

    // Get all eligible users with balances
    const eligibleUsers = await User.find({
      role: { $in: [UserRole.EMPLOYEE, UserRole.PRO_EMPLOYEE] }
    })
    .select('name username role balance')
    .sort('name');

    // Format user balances
    const userBalances = eligibleUsers.map(user => ({
      userId: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      balance: user.balance || 0
    }));

    res.json({
      payments,
      userBalances,
      eligibleUsers: eligibleUsers.map(user => ({
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new payment request
router.post('/', async (req, res) => {
  try {
    const { type, amount, description, userId } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle transfer between users
    if (type === 'transfer') {
      if (!userId) {
        return res.status(400).json({ message: 'Recipient user ID is required for transfers' });
      }

      const recipient = await User.findById(userId);
      if (!recipient || ![UserRole.EMPLOYEE, UserRole.PRO_EMPLOYEE, UserRole.ADMIN].includes(recipient.role)) {
        return res.status(400).json({ message: 'Invalid recipient for transfer' });
      }

      if (amount > user.balance) {
        return res.status(400).json({ 
          message: 'Insufficient balance for transfer',
          currentBalance: user.balance
        });
      }

      const payment = new Payment({
        type,
        amount,
        description: description || `Transfer to ${recipient.name}`,
        requestedBy: req.user._id,
        receivedBy: userId,
        status: 'pending'
      });

      await payment.save();

      const populatedPayment = await Payment.findById(payment._id)
        .populate('requestedBy', 'name username role')
        .populate('receivedBy', 'name username role');

      return res.status(201).json(populatedPayment);
    }

    // Regular payment request
    const payment = new Payment({
      type,
      amount,
      description,
      requestedBy: req.user._id,
      status: 'pending'
    });

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('requestedBy', 'name username role')
      .populate('approvedBy', 'name username');

    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status (admin only)
router.put('/:id/status', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Access denied. Only admin can approve payments.' });
    }

    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    payment.status = status;
    payment.approvedBy = req.user._id;

    if (status === 'approved') {
      payment.approvalDate = new Date();
    } else if (status === 'completed') {
      payment.completionDate = new Date();

      // Update user balances based on payment type
      const requestingUser = await User.findById(payment.requestedBy);
      if (!requestingUser) {
        return res.status(404).json({ message: 'Requesting user not found' });
      }

      switch (payment.type) {
        case 'deposit':
          requestingUser.balance += payment.amount;
          await requestingUser.save();
          break;

        case 'withdrawal':
          if (requestingUser.balance < payment.amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
          }
          requestingUser.balance -= payment.amount;
          await requestingUser.save();
          break;

        case 'transfer':
          const receivingUser = await User.findById(payment.receivedBy);
          if (!receivingUser) {
            return res.status(404).json({ message: 'Receiving user not found' });
          }

          if (requestingUser.balance < payment.amount) {
            return res.status(400).json({ message: 'Insufficient balance for transfer' });
          }

          requestingUser.balance -= payment.amount;
          receivingUser.balance += payment.amount;
          
          await Promise.all([
            requestingUser.save(),
            receivingUser.save()
          ]);
          break;
      }
    }

    await payment.save();

    const updatedPayment = await Payment.findById(payment._id)
      .populate('requestedBy', 'name username role')
      .populate('receivedBy', 'name username role')
      .populate('approvedBy', 'name username');

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;