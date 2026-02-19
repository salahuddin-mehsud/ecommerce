import express from 'express';
import ShippingCost from '../models/ShippingCost.js';

const router = express.Router();

// Get all shipping costs
router.get('/', async (req, res) => {
  try {
    const shippingCosts = await ShippingCost.find().sort({ country: 1 });
    res.json({
      success: true,
      data: shippingCosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get shipping cost by country (case-insensitive)
router.get('/country/:countryName', async (req, res) => {
  try {
    const countryName = req.params.countryName.toUpperCase().trim();
    
    const shippingCost = await ShippingCost.findOne({ 
      country: countryName,
      isActive: true
    });

    if (!shippingCost) {
      return res.status(404).json({
        success: false,
        message: 'Shipping cost not found for this country'
      });
    }

    res.json({
      success: true,
      data: shippingCost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new shipping cost
router.post('/', async (req, res) => {
  try {
    const { country, cost, taxPercentage } = req.body;

    // Convert country to uppercase for consistency
    const formattedCountry = country.toUpperCase().trim();

    const shippingCost = new ShippingCost({
      country: formattedCountry,
      cost: parseFloat(cost),
      taxPercentage: taxPercentage ? parseFloat(taxPercentage) : 8 // Default to 8% if not provided
    });

    const savedShippingCost = await shippingCost.save();
    
    res.status(201).json({
      success: true,
      message: 'Shipping cost created successfully',
      data: savedShippingCost
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Shipping cost for this country already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update shipping cost
router.put('/:id', async (req, res) => {
  try {
    const { country, cost, taxPercentage, isActive } = req.body;
    
    const updateData = {};
    if (country) updateData.country = country.toUpperCase().trim();
    if (cost !== undefined) updateData.cost = parseFloat(cost);
    if (taxPercentage !== undefined) updateData.taxPercentage = parseFloat(taxPercentage);
    if (isActive !== undefined) updateData.isActive = isActive;

    const shippingCost = await ShippingCost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!shippingCost) {
      return res.status(404).json({
        success: false,
        message: 'Shipping cost not found'
      });
    }

    res.json({
      success: true,
      message: 'Shipping cost updated successfully',
      data: shippingCost
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Shipping cost for this country already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete shipping cost
router.delete('/:id', async (req, res) => {
  try {
    const shippingCost = await ShippingCost.findByIdAndDelete(req.params.id);
    
    if (!shippingCost) {
      return res.status(404).json({
        success: false,
        message: 'Shipping cost not found'
      });
    }

    res.json({
      success: true,
      message: 'Shipping cost deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;