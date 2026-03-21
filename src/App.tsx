import React from 'react';
import Header from './components/common/Header';
import Auth from './components/auth/Auth';
import UserPanel from './components/panels/UserPanel';
import AdminPanel from './components/panels/AdminPanel';
import DoctorPanel from './components/panels/DoctorPanel';
import { useAppState } from './hooks/useAppState';
import type { User, Doctor } from './types';

const App: React.FC = () => {
  const { 
    users, 
    setUsers, 
    doctors, 
    setDoctors,
    appointments,
    paymentRequests,
    currentUser, 
    currentRole, 
    login, 
    logout,
    bookAppointment,
    requestMoney,
    approvePayment,
    rejectPayment,
    modifyAppointment,
    swapAppointments,
    updateAppointmentStatus,
    deleteUser
  } = useAppState();

  const handleSignup = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const handleSignupDoctor = (newDoctor: Doctor) => {
    setDoctors([...doctors, newDoctor]);
  };

  if (!currentUser) {
    return (
      <Auth 
        onLogin={login} 
        users={users} 
        doctors={doctors}
        onSignup={handleSignup} 
        onSignupDoctor={handleSignupDoctor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentUser={currentUser} onLogout={logout} />
      
      <main className="flex-1 container mx-auto p-4 md:p-6">
        {currentRole === 'user' && (
          <UserPanel 
            user={currentUser as User}
            doctors={doctors}
            appointments={appointments}
            paymentRequests={paymentRequests}
            onBookAppointment={bookAppointment}
            onRequestMoney={requestMoney}
          />
        )}

        {currentRole === 'admin' && (
          <AdminPanel 
            users={users}
            doctors={doctors}
            appointments={appointments}
            paymentRequests={paymentRequests}
            onApprovePayment={approvePayment}
            onRejectPayment={rejectPayment}
            onAddUser={(u) => setUsers([...users, u])}
            onAddDoctor={() => {}} // TODO
            onDeleteUser={deleteUser}
            onDeleteDoctor={() => {}} // TODO
          />
        )}

        {currentRole === 'doctor' && (
          <DoctorPanel 
            doctor={currentUser as Doctor}
            appointments={appointments}
            users={users}
            onUpdateStatus={updateAppointmentStatus}
            onModifyAppointment={modifyAppointment}
            onSwapAppointments={swapAppointments}
          />
        )}
      </main>
      
      <footer className="p-6 text-center text-gray-400 text-sm">
        &copy; 2024 MediConnect. Your health, our priority.
      </footer>
    </div>
  );
};

export default App;
