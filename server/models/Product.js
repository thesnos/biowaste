import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  materials: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;