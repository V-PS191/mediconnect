const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
require('dotenv').config({ path: '../.env' });

const initialUsers = [
  { username: 'user1', password: 'user1', role: 'user', name: 'Rajesh Kumar', walletBalance: 1500, phone: '555-0201', email: 'rajesh@example.com' },
  { username: 'user2', password: 'user2', role: 'user', name: 'Sneha Sharma', walletBalance: 2000, phone: '555-0202', email: 'sneha@example.com' },
  { username: 'admin', password: 'admin', role: 'admin', name: 'System Admin', walletBalance: 0, phone: '000-0000', email: 'admin@mediconnect.com' }
];

const initialDoctors = [
  { name: 'Dr. Priya Sharma', username: 'doctor1', password: 'doctor1', specialization: 'Cardiology', phone: '555-0101', appointmentFee: 700, shiftStart: '08:00', shiftEnd: '16:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { name: 'Dr. Rohan Gupta', username: 'doctor2', password: 'doctor2', specialization: 'Cardiology', phone: '555-0102', appointmentFee: 750, shiftStart: '16:00', shiftEnd: '00:00', lunchStart: '20:00', lunchEnd: '21:00' }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.VITE_MONGODB_URI);
    await User.deleteMany({});
    await Doctor.deleteMany({});
    
    await User.insertMany(initialUsers);
    await Doctor.insertMany(initialDoctors);
    
    console.log('Database seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
