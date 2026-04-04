const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  doctorName: { type: String, default: 'Self Uploaded' },
  date: { type: String, required: true },
  fileLabel: { type: String, required: true },
  fileUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
