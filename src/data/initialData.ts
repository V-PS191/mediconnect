import type { User, Doctor, Appointment, PaymentRequest, Transaction } from '../types';
import { getRelativeDate } from '../utils/dateUtils';

export const initialDoctors: Doctor[] = [
  { id: 1, name: 'Dr. Priya Sharma', username: 'doctor1', password: 'doctor1', specialization: 'Cardiology', phone: '555-0101', appointmentFee: 700, shiftStart: '08:00', shiftEnd: '16:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: 2, name: 'Dr. Rohan Gupta', username: 'doctor2', password: 'doctor2', specialization: 'Cardiology', phone: '555-0102', appointmentFee: 750, shiftStart: '16:00', shiftEnd: '00:00', lunchStart: '20:00', lunchEnd: '21:00' },
  { id: 3, name: 'Dr. Ananya Reddy', username: 'doctor3', password: 'doctor3', specialization: 'Dermatology', phone: '555-0103', appointmentFee: 800, shiftStart: '00:00', shiftEnd: '08:00', lunchStart: '04:00', lunchEnd: '05:00' },
  { id: 4, name: 'Dr. Vikram Singh', username: 'doctor4', password: 'doctor4', specialization: 'Dermatology', phone: '555-0104', appointmentFee: 600, shiftStart: '08:00', shiftEnd: '16:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: 5, name: 'Dr. Neha Kakkar', username: 'doctor5', password: 'doctor5', specialization: 'Pediatrics', phone: '555-0105', appointmentFee: 500, shiftStart: '09:00', shiftEnd: '17:00', lunchStart: '13:00', lunchEnd: '14:00' }
];

export const initialUsers: User[] = [
  { id: 101, name: 'Rajesh Kumar', username: 'user1', password: 'user1', email: 'rajesh@example.com', phone: '555-0201', walletBalance: 1500 },
  { id: 102, name: 'Sneha Sharma', username: 'user2', password: 'user2', email: 'sneha@example.com', phone: '555-0202', walletBalance: 2000 },
  { id: 103, name: 'Amit Patel', username: 'user3', password: 'user3', email: 'amit@example.com', phone: '555-0203', walletBalance: 1200 },
  { id: 104, name: 'Anjali Gupta', username: 'user4', password: 'user4', email: 'anjali@example.com', phone: '555-0204', walletBalance: 1800 },
  { id: 105, name: 'Vikram Sethi', username: 'user5', password: 'user5', email: 'vikram@example.com', phone: '555-0205', walletBalance: 2500 },
  { id: 106, name: 'Priya Verma', username: 'user6', password: 'user6', email: 'priyav@example.com', phone: '555-0206', walletBalance: 900 },
  { id: 107, name: 'Sanjay Dutt', username: 'user7', password: 'user7', email: 'sanjay@example.com', phone: '555-0207', walletBalance: 3000 },
  { id: 108, name: 'Deepika P', username: 'user8', password: 'user8', email: 'deepika@example.com', phone: '555-0208', walletBalance: 5000 },
  { id: 109, name: 'Arjun Kapoor', username: 'user9', password: 'user9', email: 'arjun@example.com', phone: '555-0209', walletBalance: 1500 },
  { id: 110, name: 'Kareena K', username: 'user10', password: 'user10', email: 'kareena@example.com', phone: '555-0210', walletBalance: 2200 },
  { id: 999, name: 'System Admin', username: 'admin', password: 'admin', email: 'admin@mediconnect.com', phone: '000-0000', walletBalance: 0 }
];

const showcaseDay = getRelativeDate(0, true, true);

export const initialAppointments: Appointment[] = [
  {
    id: 1,
    userId: 1,
    doctorId: 4,
    date: showcaseDay,
    time: '09:00',
    status: 'confirmed',
    reason: 'Annual Checkup',
    duration: 30,
    notes: ''
  }
];

export const initialPaymentRequests: PaymentRequest[] = [];

export const initialTransactions: Transaction[] = [];
