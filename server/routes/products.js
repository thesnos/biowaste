import express from 'express';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('materials.material')
      .populate('createdBy', 'name username');
    
    const transformedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      size: product.size,
      materials: product.materials.map(m => ({
        material: {
          id: m.material._id,
          name: m.material.name,
          quantity: m.material.quantity,
          size: m.material.size
        },
        quantity: m.quantity
      })),
      createdBy: product.createdBy
    }));
    
    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { name, size, materials } = req.body;
    
    const newProduct = new Product({
      name,
      size,
      materials: materials.map(m => ({
        material: m.material.id,
        quantity: m.quantity
      })),
      createdBy: req.user._id
    });
    
    await newProduct.save();
    
    const populatedProduct = await Product.findById(newProduct._id)
      .populate('materials.material')
      .populate('createdBy', 'name username');
    
    res.status(201).json({
      id: populatedProduct._id,
      name: populatedProduct.name,
      size: populatedProduct.size,
      materials: populatedProduct.materials.map(m => ({
        material: {
          id: m.material._id,
          name: m.material.name,
          quantity: m.material.quantity,
          size: m.material.size
        },
        quantity: m.quantity
      })),
      createdBy: populatedProduct.createdBy
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, size, materials } = req.body;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        size,
        materials: materials.map(m => ({
          material: m.material.id,
          quantity: m.quantity
        }))
      },
      { new: true }
    )
    .populate('materials.material')
    .populate('createdBy', 'name username');
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      id: updatedProduct._id,
      name: updatedProduct.name,
      size: updatedProduct.size,
      materials: updatedProduct.materials.map(m => ({
        material: {
          id: m.material._id,
          name: m.material.name,
          quantity: m.material.quantity,
          size: m.material.size
        },
        quantity: m.quantity
      })),
      createdBy: updatedProduct.createdBy
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;