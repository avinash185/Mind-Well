const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'Counselor', required: true },
  counselorName: { type: String },
  counselorEmail: { type: String },
  reason: { type: String, required: true },
  preferredTime: { type: String, default: '16:00-17:00' },
  status: { type: String, enum: ['requested', 'confirmed', 'declined'], default: 'requested' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);