import { useState, useEffect } from 'react';
import type { User, Doctor, Appointment, PaymentRequest, Role, Transaction } from '../types';
import { initialUsers, initialDoctors, initialAppointments, initialPaymentRequests, initialTransactions } from '../data/initialData';

export const useAppState = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(initialPaymentRequests);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [currentUser, setCurrentUser] = useState<User | Doctor | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentRole, setCurrentRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem('currentRole');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser !== null) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }

    if (currentRole !== null) {
      localStorage.setItem('currentRole', JSON.stringify(currentRole));
    } else {
      localStorage.removeItem('currentRole');
    }
  }, [currentUser, currentRole]);

  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        const [usersRes, doctorsRes, appointmentsRes] = await Promise.all([
          fetch('http://localhost:5000/api/users'),
          fetch('http://localhost:5000/api/doctors'),
          fetch('http://localhost:5000/api/appointments')
        ]);
        
        if (usersRes.ok) {
          const dbUsers = await usersRes.json();
          const formattedUsers = dbUsers.map((u: any) => ({ ...u, id: u._id || u.id }));
          setUsers(prev => [...prev.filter(pu => !formattedUsers.find((dbu: any) => dbu.username === pu.username)), ...formattedUsers]);
        }
        
        if (doctorsRes.ok) {
          const dbDoctors = await doctorsRes.json();
          const formattedDoctors = dbDoctors.map((d: any) => ({ ...d, id: d._id || d.id }));
          setDoctors(prev => [...prev.filter(pd => !formattedDoctors.find((dbd: any) => dbd.username === pd.username)), ...formattedDoctors]);
        }
        
        if (appointmentsRes.ok) {
          const dbAppointments = await appointmentsRes.json();
          const formattedAppointments = dbAppointments.map((a: any) => ({ ...a, id: a._id || a.id }));
          setAppointments(prev => [...prev.filter(pa => !formattedAppointments.find((dba: any) => (dba._id === pa.id) || (dba.id === pa.id))), ...formattedAppointments]);
        }
      } catch (err) {
        console.error("Failed to connect to backend MongoDB", err);
      }
    };

    fetchDatabaseData();
  }, []);

  const login = (role: Role, user: User | Doctor) => {
    setCurrentUser(user);
    setCurrentRole(role);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const bookAppointment = async (appointment: Appointment) => {
    let doctor: Doctor | undefined;
    // Guard: check wallet balance before booking
    if (currentRole === 'user' && currentUser) {
      doctor = doctors.find(d => d.id === appointment.doctorId || (d as any)._id === appointment.doctorId);
      if (doctor && (currentUser as User).walletBalance < doctor.appointmentFee) {
        return; // Block booking if insufficient balance
      }
    }

    try {
      // Trigger the backend to save appointment and SEND EMAIL
      const backendPayload = {
        ...appointment,
        userId: (currentUser as any)._id || currentUser?.id,
        doctorId: appointment.doctorId,
        userObj: currentUser,
        doctorObj: doctor || doctors.find(d => d.id === appointment.doctorId)
      };

      await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      });
    } catch(err) {
      console.warn("Failed to reach email server", err);
    }

    setAppointments([...appointments, appointment]);
    // Deduct fee from user wallet
    if (currentRole === 'user' && currentUser) {
      doctor = doctor || doctors.find(d => d.id === appointment.doctorId);
      if (doctor) {
        const updatedUser = { ...currentUser as User, walletBalance: (currentUser as User).walletBalance - doctor.appointmentFee };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        
        // Record transaction
        const newTx: Transaction = {
          id: Date.now(),
          userId: currentUser.id,
          type: 'debit',
          amount: doctor.appointmentFee,
          description: `Paid for appointment with ${doctor.name}`,
          timestamp: new Date().toISOString()
        };
        setTransactions([...transactions, newTx]);
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
        status: 'approved',
        timestamp: new Date().toLocaleString()
      };
      setPaymentRequests([...paymentRequests, newRequest]);

      const updatedUser = { ...currentUser as User, walletBalance: (currentUser as User).walletBalance + amount };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));

      const newTx: Transaction = {
        id: Date.now() + 1,
        userId: updatedUser.id,
        type: 'credit',
        amount: amount,
        description: `Funds added directly via UTR: ${utr}`,
        timestamp: new Date().toISOString()
      };
      setTransactions([...transactions, newTx]);
    }
  };

  const approvePayment = (requestId: number) => {
    const request = paymentRequests.find(p => p.id === requestId);
    if (request && request.status === 'pending') {
      const updatedUser = users.find(u => u.id === request.userId);
      if (updatedUser) {
        const newUser = { ...updatedUser, walletBalance: updatedUser.walletBalance + request.amount };
        setUsers(users.map(u => u.id === newUser.id ? newUser : u));
        
        // Record credit transaction
        const newTx: Transaction = {
          id: Date.now() + 1, // +1 ensures unique ID even if processed at exact same ms as something else
          userId: updatedUser.id,
          type: 'credit',
          amount: request.amount,
          description: `Funds added via UTR: ${request.utr}`,
          timestamp: new Date().toISOString()
        };
        setTransactions(prev => [...prev, newTx]);
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

  const delayAppointment = (aptId: number) => {
    const aptToDelay = appointments.find(a => a.id === aptId);
    if (!aptToDelay) return;

    const doctorId = aptToDelay.doctorId;
    
    // Get all upcoming appointments sorted by actual time slot
    const upcomingForDoctor = appointments.filter(a => 
      a.doctorId === doctorId && 
      (a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled')
    ).sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());

    const currentIndex = upcomingForDoctor.findIndex(a => a.id === aptId);
    // If appointment isn't found or is already the last in the list, we can't delay it further
    if (currentIndex === -1 || currentIndex === upcomingForDoctor.length - 1) return;

    // Find the NEXT appointment that HAS NOT been delayed
    let swapTargetIndex = -1;
    for (let i = currentIndex + 1; i < upcomingForDoctor.length; i++) {
      if (!upcomingForDoctor[i].delayStamp) {
        swapTargetIndex = i;
        break;
      }
    }

    // If everyone below has already delayed, just swap with the immediate next one
    if (swapTargetIndex === -1) {
      swapTargetIndex = currentIndex + 1;
    }

    const targetApt = upcomingForDoctor[swapTargetIndex];

    // Swap their time slots and mark the delayed one
    setAppointments(appointments.map(a => {
      if (a.id === aptToDelay.id) {
        return { 
          ...a, 
          date: targetApt.date, 
          time: targetApt.time, 
          status: 'rescheduled', 
          delayStamp: Date.now() 
        };
      }
      if (a.id === targetApt.id) {
        return { 
          ...a, 
          date: aptToDelay.date, 
          time: aptToDelay.time, 
          status: 'rescheduled' 
        };
      }
      return a;
    }));
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
    transactions,
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
    delayAppointment,
    deleteUser
  };
};
