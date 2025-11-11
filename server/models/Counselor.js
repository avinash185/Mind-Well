const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true }, // e.g., 'Mon', 'Tue'
  startTime: { type: String, required: true }, // e.g., '16:00'
  endTime: { type: String, required: true },   // e.g., '17:00'
});

const CounselorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  specialties: [{ type: String }],
  availability: [AvailabilitySchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Counselor', CounselorSchema);