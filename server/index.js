const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// MongoDB Connection
mongoose.connect(process.env.VITE_MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
const emailService = require('./utils/emailService');

// Routes
// Authentication (Simplified for now)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, username } = req.body;
    
    if (role === 'doctor') {
      const existingDoc = await Doctor.findOne({ username });
      if (existingDoc) return res.status(400).json({ message: 'Username already taken' });
      
      const newDoctor = new Doctor(req.body);
      await newDoctor.save();
      return res.status(201).json(newDoctor);
    } else {
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ message: 'Username already taken' });
      
      // Default to 'user' if role isn't explicitly provided (like 'admin')
      req.body.role = req.body.role || 'user';
      const newUser = new User(req.body);
      await newUser.save();
      return res.status(201).json(newUser);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await User.findOne({ username, password, role });
    if (!user) {
      // Check if it's a doctor
      if (role === 'doctor') {
        const doctor = await Doctor.findOne({ username, password });
        if (doctor) return res.json(doctor);
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { username, newPassword, role } = req.body;
  try {
    if (role === 'doctor') {
      const doctor = await Doctor.findOne({ username });
      if (!doctor) return res.status(404).json({ message: 'User not found' });
      doctor.password = newPassword;
      await doctor.save();
      return res.json({ message: 'Password reset successful' });
    } else {
      const userRole = role === 'admin' ? 'admin' : 'user';
      const user = await User.findOne({ username }); // Find by username regardless of role to simplify
      if (!user || user.role !== userRole) return res.status(404).json({ message: 'User not found' });
      user.password = newPassword;
      await user.save();
      return res.json({ message: 'Password reset successful' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();

    // Send calendar invite
    try {
      // Find the user/doctor by ObjectId, or fallback to the frontend's mock object if it was passed
      // We'll trust whatever info is passed from the body, or lookup if it's a valid ID.
      let user = null;
      let doctor = null;

      if (mongoose.Types.ObjectId.isValid(appointment.userId)) {
        user = await User.findById(appointment.userId);
      } else {
        // Fallback for mock IDs
        user = Object.assign({ name: req.body.patientName || 'Patient', email: req.body.patientEmail || 'singhneetu02101985@gmail.com' }, req.body.userObj);
      }

      if (mongoose.Types.ObjectId.isValid(appointment.doctorId)) {
        doctor = await Doctor.findById(appointment.doctorId);
      } else {
        doctor = Object.assign({ name: req.body.doctorName || 'Doctor' }, req.body.doctorObj);
      }

      if (user && doctor) {
        emailService.sendAppointmentCalendarInvite(user, doctor, appointment);
      }
    } catch (emailErr) {
      console.error('Error triggering email service:', emailErr);
    }

    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Medical Records
app.get('/api/medical-records/:userId', async (req, res) => {
  try {
    const records = await MedicalRecord.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/medical-records', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { userId, title, doctorName, date } = req.body;
    
    // Construct the URL to access the file
    // Assumes server is running on the same host, so a relative URL is returned
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    const newRecord = new MedicalRecord({
      userId,
      title,
      doctorName: doctorName || 'Self Uploaded',
      date,
      fileLabel: req.file.originalname,
      fileUrl: fileUrl
    });

    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
