const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  doctorId: { type: mongoose.Schema.Types.Mixed, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rescheduled', 'completed', 'noShow'],
    default: 'pending'
  },
  reason: { type: String },
  duration: { type: Number, default: 30 },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
