import React, { useState } from 'react';
import type { User, Doctor, Appointment, PaymentRequest } from '../../types';

interface AdminPanelProps {
  users: User[];
  doctors: Doctor[];
  appointments: Appointment[];
  paymentRequests: PaymentRequest[];
  onApprovePayment: (requestId: number) => void;
  onRejectPayment: (requestId: number) => void;
  onAddUser: (user: User) => void;
  onAddDoctor: (doctor: Doctor) => void;
  onDeleteUser: (userId: number) => void;
  onDeleteDoctor: (doctorId: number) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  doctors,
  appointments,
  paymentRequests,
  onApprovePayment,
  onRejectPayment,
  onDeleteUser,
  onDeleteDoctor
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'doctors' | 'appointments' | 'payments'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'bg-indigo-500' },
          { label: 'Total Doctors', value: doctors.length, color: 'bg-emerald-500' },
          { label: 'Appointments', value: appointments.length, color: 'bg-purple-500' },
          { label: 'Pending Payments', value: pendingPayments.length, color: 'bg-rose-500' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
            <p className="text-xs font-bold uppercase opacity-80">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['users', 'doctors', 'appointments', 'payments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold capitalize transition-all border-b-2 
              ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {tab} {tab === 'payments' && pendingPayments.length > 0 && 
              <span className="ml-2 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">{pendingPayments.length}</span>
            }
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <input 
            type="search" 
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64"
          />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95">
            + Add New
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'users' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Wallet</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 font-bold text-gray-800">{u.name} <span className="text-gray-400 font-normal">(@{u.username})</span></td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">₹ {u.walletBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => onDeleteUser(u.id)} className="text-rose-500 hover:text-rose-700 font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'payments' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">UTR</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingPayments.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 font-bold text-gray-800">{users.find(u => u.id === p.userId)?.name}</td>
                    <td className="px-6 py-4 font-bold">₹ {p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-xs">{p.utr}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => onApprovePayment(p.id)} className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold">Approve</button>
                      <button onClick={() => onRejectPayment(p.id)} className="bg-rose-500 text-white px-3 py-1 rounded-lg font-bold">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'doctors' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Fee</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDoctors.map(d => (
                  <tr key={d.id}>
                    <td className="px-6 py-4 font-bold">{d.name}</td>
                    <td className="px-6 py-4">{d.specialization}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">₹ {d.appointmentFee}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => onDeleteDoctor(d.id)} className="text-rose-500 hover:text-rose-700 font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'appointments' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 font-bold">{users.find(u => u.id === a.userId)?.name}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{doctors.find(d => d.id === a.doctorId)?.name}</td>
                    <td className="px-6 py-4 font-medium">{a.date} at {a.time}</td>
                    <td className="px-6 py-4 uppercase text-[10px] font-bold">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
