const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Counselor = require('../models/Counselor');
const { sendCounselingRequest } = require('../utils/mailer');

// Create a booking request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { counselorEmail, counselorName, reason, preferredTime } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    // Resolve counselor by email or name
    let counselor = null;
    if (counselorEmail) {
      counselor = await Counselor.findOne({ email: counselorEmail, isActive: true });
    }
    if (!counselor && counselorName) {
      counselor = await Counselor.findOne({ name: new RegExp(counselorName, 'i'), isActive: true });
    }

    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      counselor: counselor._id,
      counselorName: counselor.name,
      counselorEmail: counselor.email,
      reason,
      preferredTime: preferredTime || '16:00-17:00',
    });
    // Try to get a quick send status (up to ~3.5s), else return queued
    const payload = {
      counselorEmail: counselor.email,
      counselorName: counselor.name,
      userName: req.user.name || req.user.email,
      userEmail: req.user.email,
      reason,
      preferredTime: preferredTime || '4-5 PM',
    };

    const sendPromise = sendCounselingRequest(payload);
    let emailStatus;
    try {
      const quickResult = await Promise.race([
        sendPromise,
        new Promise((resolve) => setTimeout(() => resolve({ queued: true }), 3500)),
      ]);
      emailStatus = quickResult;
    } catch (e) {
      console.error('Immediate email send error:', e);
      emailStatus = { queued: true };
    } finally {
      // Always log the final provider status when it completes
      sendPromise
        .then((status) => console.log('Email status:', status))
        .catch((err) => console.error('Booking email send error:', err));
    }

    res.status(201).json({ success: true, data: { booking, emailStatus } });
  } catch (error) {
    console.error('Booking create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// List user bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: { bookings } });
  } catch (error) {
    console.error('Booking list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

module.exports = router;