import express from 'express';
import RawMaterial from '../models/RawMaterial.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all raw materials
router.get('/', async (req, res) => {
  try {
    const materials = await RawMaterial.find()
      .populate('createdBy', 'name username');
    
    const transformedMaterials = materials.map(material => ({
      id: material._id,
      name: material.name,
      quantity: material.quantity,
      size: material.size,
      createdBy: material.createdBy
    }));
    
    res.json(transformedMaterials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new raw material
router.post('/', async (req, res) => {
  try {
    const { name, quantity, size } = req.body;
    
    if (!name || typeof quantity !== 'number' || !size) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        details: 'Name, quantity, and size are required. Quantity must be a number.' 
      });
    }

    const newMaterial = new RawMaterial({
      name,
      quantity,
      size,
      createdBy: req.user._id
    });
    
    await newMaterial.save();
    
    const populatedMaterial = await RawMaterial.findById(newMaterial._id)
      .populate('createdBy', 'name username');
    
    res.status(201).json({
      id: populatedMaterial._id,
      name: populatedMaterial.name,
      quantity: populatedMaterial.quantity,
      size: populatedMaterial.size,
      createdBy: populatedMaterial.createdBy
    });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ 
      message: 'Failed to create material', 
      error: error.message 
    });
  }
});

// Update raw material
router.put('/:id', async (req, res) => {
  try {
    const { name, quantity, size } = req.body;
    
    if (!name || typeof quantity !== 'number' || !size) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        details: 'Name, quantity, and size are required. Quantity must be a number.' 
      });
    }

    const updatedMaterial = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      { name, quantity, size },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name username');
    
    if (!updatedMaterial) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.json({
      id: updatedMaterial._id,
      name: updatedMaterial.name,
      quantity: updatedMaterial.quantity,
      size: updatedMaterial.size,
      createdBy: updatedMaterial.createdBy
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ 
      message: 'Failed to update material', 
      error: error.message 
    });
  }
});

// Delete raw material
router.delete('/:id', async (req, res) => {
  try {
    const material = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ 
      message: 'Failed to delete material', 
      error: error.message 
    });
  }
});

export default router;