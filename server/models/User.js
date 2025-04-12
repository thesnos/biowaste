import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  PRO_EMPLOYEE: 'pro_employee',
  EMPLOYEE: 'employee'
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.EMPLOYEE
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update balance
userSchema.methods.updateBalance = async function(amount, type) {
  if (type === 'deposit') {
    this.balance += amount;
  } else if (type === 'withdrawal' || type === 'transfer') {
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.balance -= amount;
  }
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;