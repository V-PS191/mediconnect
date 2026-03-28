const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'doctor' },
  specialization: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  offDays: { type: [Number], default: [] },
  appointmentFee: { type: Number, required: true },
  shiftStart: { type: String, required: true },
  shiftEnd: { type: String, required: true },
  lunchStart: { type: String, required: true },
  lunchEnd: { type: String, required: true },
  experience: { type: String },
  about: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);

