import { useState } from 'react';
import type { User, Doctor, Appointment, PaymentRequest, Role } from '../types';
import { initialUsers, initialDoctors, initialAppointments, initialPaymentRequests } from '../data/initialData';

export const useAppState = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(initialPaymentRequests);
  const [currentUser, setCurrentUser] = useState<User | Doctor | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  const login = (role: Role, user: User | Doctor) => {
    setCurrentUser(user);
    setCurrentRole(role);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const bookAppointment = (appointment: Appointment) => {
    // Guard: check wallet balance before booking
    if (currentRole === 'user' && currentUser) {
      const doctor = doctors.find(d => d.id === appointment.doctorId);
      if (doctor && (currentUser as User).walletBalance < doctor.appointmentFee) {
        return; // Block booking if insufficient balance
      }
    }

    setAppointments([...appointments, appointment]);
    // Deduct fee from user wallet
    if (currentRole === 'user' && currentUser) {
      const doctor = doctors.find(d => d.id === appointment.doctorId);
      if (doctor) {
        const updatedUser = { ...currentUser as User, walletBalance: (currentUser as User).walletBalance - doctor.appointmentFee };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
    }
  };

  const requestMoney = (amount: number, utr: string) => {
    if (currentRole === 'user' && currentUser) {
      const newRequest: PaymentRequest = {
        id: Date.now(),
        userId: currentUser.id,
        amount,
        method: 'online',
        utr,
        status: 'pending',
        timestamp: new Date().toLocaleString()
      };
      setPaymentRequests([...paymentRequests, newRequest]);
    }
  };

  const approvePayment = (requestId: number) => {
    const request = paymentRequests.find(p => p.id === requestId);
    if (request && request.status === 'pending') {
      const updatedUser = users.find(u => u.id === request.userId);
      if (updatedUser) {
        const newUser = { ...updatedUser, walletBalance: updatedUser.walletBalance + request.amount };
        setUsers(users.map(u => u.id === newUser.id ? newUser : u));
      }
      setPaymentRequests(paymentRequests.map(p => p.id === requestId ? { ...p, status: 'approved' } : p));
    }
  };

  const rejectPayment = (requestId: number) => {
    setPaymentRequests(paymentRequests.map(p => p.id === requestId ? { ...p, status: 'rejected' } : p));
  };

  const updateAppointmentStatus = (aptId: number, status: Appointment['status']) => {
    setAppointments(appointments.map(a => a.id === aptId ? { ...a, status } : a));
  };

  const modifyAppointment = (aptId: number, newDate: string, newTime: string) => {
    setAppointments(appointments.map(a => a.id === aptId ? { ...a, date: newDate, time: newTime, status: 'rescheduled' } : a));
  };

  const swapAppointments = (aptId1: number, aptId2: number) => {
    const apt1 = appointments.find(a => a.id === aptId1);
    const apt2 = appointments.find(a => a.id === aptId2);
    
    if (apt1 && apt2) {
      setAppointments(appointments.map(a => {
        if (a.id === aptId1) return { ...a, date: apt2.date, time: apt2.time, status: 'rescheduled' };
        if (a.id === aptId2) return { ...a, date: apt1.date, time: apt1.time, status: 'rescheduled' };
        return a;
      }));
    }
  };

  const deleteUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
    setAppointments(appointments.filter(a => a.userId !== userId));
  };

  return {
    users,
    setUsers,
    doctors,
    setDoctors,
    appointments,
    setAppointments,
    paymentRequests,
    setPaymentRequests,
    currentUser,
    currentRole,
    login,
    logout,
    bookAppointment,
    requestMoney,
    approvePayment,
    rejectPayment,
    updateAppointmentStatus,
    modifyAppointment,
    swapAppointments,
    deleteUser
  };
};
