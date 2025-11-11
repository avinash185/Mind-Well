require('dotenv').config();
const mongoose = require('mongoose');
const Counselor = require('./models/Counselor');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-platform';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const samples = [
    {
      name: 'Dr. Alice Parker',
      email: 'alice.parker@example.com',
      specialties: ['anxiety', 'stress'],
      availability: [{ dayOfWeek: 'Mon', startTime: '16:00', endTime: '17:00' }],
    },
    {
      name: 'Dr. Ben Carter',
      email: 'ben.carter@example.com',
      specialties: ['depression'],
      availability: [{ dayOfWeek: 'Tue', startTime: '16:00', endTime: '17:00' }],
    },
  ];

  for (const c of samples) {
    const existing = await Counselor.findOne({ email: c.email });
    if (existing) {
      await Counselor.updateOne({ email: c.email }, { $set: c });
      console.log('Updated counselor:', c.email);
    } else {
      await Counselor.create(c);
      console.log('Created counselor:', c.email);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});