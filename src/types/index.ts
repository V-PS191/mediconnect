export type Role = 'user' | 'admin' | 'doctor';

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone: string;
  address?: string;
  walletBalance: number;
  role?: 'admin' | 'user';
}

export interface Doctor {
  id: number;
  name: string;
  username: string;
  password?: string;
  specialization: string;
  phone: string;
  address?: string;
  offDays?: number[];
  appointmentFee: number;
  shiftStart: string;
  shiftEnd: string;
  lunchStart: string;
  lunchEnd: string;
}

export interface Appointment {
  id: number;
  userId: number;
  doctorId: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'noShow';
  reason: string;
  duration: number;
  notes: string;
}

export interface PaymentRequest {
  id: number;
  userId: number;
  amount: number;
  method: string;
  utr: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface Transaction {
  id: number;
  userId: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
}
