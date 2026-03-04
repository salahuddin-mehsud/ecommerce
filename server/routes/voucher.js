import express from 'express';
import Voucher from '../models/Voucher.js';
import { verifyAdmin } from './admin.js'; // reuse admin middleware

const router = express.Router();


// Public: create a voucher (before payment)
router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, shippingCost, taxAmount, taxPercentage, total, paymentMethod } = req.body;

    // Generate voucher code (existing logic)
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const voucherCode = `VCH-${timestamp}${random}`;

    // Generate unique 5‑digit special code
    let specialCode;
    let unique = false;
    while (!unique) {
      const code = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digits
      const existing = await Voucher.findOne({ specialCode: code });
      if (!existing) {
        specialCode = code;
        unique = true;
      }
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 2);

    const voucher = new Voucher({
      voucherCode,
      specialCode,               // ✅ set explicitly
      customer,
      items,
      subtotal,
      shippingCost,
      taxAmount,
      taxPercentage,
      total,
      expiryDate,
      paymentMethod,
      status: 'pending_payment',
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
    });

    const saved = await voucher.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public: update payment status after successful payment
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, paymentDetails } = req.body;
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    voucher.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') {
      voucher.status = 'active';
      voucher.paymentDetails = paymentDetails;
    }
    await voucher.save();

    res.json({ success: true, data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: get all vouchers
router.get('/admin', verifyAdmin, async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: get voucher by code
router.get('/admin/:code', verifyAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findOne({ voucherCode: req.params.code });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }
    res.json({ success: true, data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: redeem voucher
router.patch('/admin/:code/redeem', verifyAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findOne({ voucherCode: req.params.code });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }
    if (voucher.status === 'redeemed') {
      return res.status(400).json({ success: false, message: 'Already redeemed' });
    }
    if (voucher.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Voucher has expired' });
    }
    if (voucher.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    voucher.status = 'redeemed';
    voucher.redeemedAt = new Date();
    await voucher.save();

    res.json({ success: true, message: 'Redeemed successfully', data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: redeem voucher by special code
router.patch('/admin/redeem/:specialCode', verifyAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findOne({ specialCode: req.params.specialCode });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }
    if (voucher.status === 'redeemed') {
      return res.status(400).json({ success: false, message: 'Already redeemed' });
    }
    if (voucher.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Voucher has expired' });
    }
    if (voucher.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    voucher.status = 'redeemed';
    voucher.redeemedAt = new Date();
    await voucher.save();

    res.json({ success: true, message: 'Redeemed successfully', data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;