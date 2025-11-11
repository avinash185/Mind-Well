const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Counselor = require('../models/Counselor');

// List counselors, optionally filter by email or name
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { email, name, active } = req.query;
    const filter = {};
    if (email) filter.email = email;
    if (name) filter.name = new RegExp(name, 'i');
    if (active !== undefined) filter.isActive = active === 'true';

    const counselors = await Counselor.find(filter).lean();
    res.json({ success: true, data: { counselors } });
  } catch (error) {
    console.error('Counselor list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch counselors' });
  }
});

module.exports = router;