import React, { useState } from 'react';
import type { User, Doctor, Appointment, PaymentRequest } from '../../types';
import { getRelativeDate } from '../../utils/dateUtils';

interface UserPanelProps {
  user: User;
  doctors: Doctor[];
  appointments: Appointment[];
  paymentRequests: PaymentRequest[];
  onBookAppointment: (appointment: Appointment) => void;
  onRequestMoney: (amount: number, utr: string) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({
  user,
  doctors,
  appointments,
  onBookAppointment,
  onRequestMoney
}) => {
  const [bookingData, setBookingData] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });

  const [walletData, setWalletData] = useState({
    amount: '',
    utr: ''
  });

  const [bookingError, setBookingError] = useState<string | null>(null);

  const userAppointments = appointments
    .filter(a => a.userId === user.id)
    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());

  // Get selected doctor for live fee display
  const selectedDoctor = bookingData.doctorId
    ? doctors.find(d => d.id === parseInt(bookingData.doctorId))
    : null;

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    const doctor = doctors.find(d => d.id === parseInt(bookingData.doctorId));
    if (!doctor) return;

    // Wallet balance check
    if (user.walletBalance < doctor.appointmentFee) {
      setBookingError(
        `Insufficient balance! You need ₹${doctor.appointmentFee.toFixed(2)} but your wallet has only ₹${user.walletBalance.toFixed(2)}. Please add money to your wallet first.`
      );
      return;
    }

    const newApt: Appointment = {
      id: Date.now(),
      userId: user.id,
      doctorId: doctor.id,
      date: bookingData.date,
      time: bookingData.time,
      status: 'pending',
      reason: bookingData.reason,
      duration: 30,
      notes: ''
    };
    onBookAppointment(newApt);
    setBookingData({ doctorId: '', date: '', time: '', reason: '' });
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestMoney(parseFloat(walletData.amount), walletData.utr);
    setWalletData({ amount: '', utr: '' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Card */}
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">📅</span> Book an Appointment
          </h3>
          <form onSubmit={handleBookSubmit} className="space-y-4">
            {/* Error Banner */}
            {bookingError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="text-red-700 font-bold text-sm">Booking Failed</p>
                  <p className="text-red-600 text-sm mt-1">{bookingError}</p>
                  <p className="text-red-500 text-xs mt-2 font-medium">👉 Go to your Wallet section below to add money first.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Select Doctor</label>
              <select
                value={bookingData.doctorId}
                onChange={(e) => { setBookingData({ ...bookingData, doctorId: e.target.value }); setBookingError(null); }}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">-- Choose a Doctor --</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization}) - ₹{doc.appointmentFee}
                  </option>
                ))}
              </select>
            </div>

            {/* Live balance warning when doctor is selected */}
            {selectedDoctor && user.walletBalance < selectedDoctor.appointmentFee && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <span className="text-amber-500 text-lg">💰</span>
                <p className="text-amber-700 text-sm">
                  <span className="font-bold">Low Balance:</span> Doctor fee is ₹{selectedDoctor.appointmentFee.toFixed(2)} but your wallet has ₹{user.walletBalance.toFixed(2)}. Add money to proceed.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  min={getRelativeDate(1)}
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
                <input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Reason for Visit</label>
              <textarea
                value={bookingData.reason}
                onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                placeholder="Describe your symptoms..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={selectedDoctor ? user.walletBalance < selectedDoctor.appointmentFee : false}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95
                ${selectedDoctor && user.walletBalance < selectedDoctor.appointmentFee
                  ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                }`}
            >
              {selectedDoctor && user.walletBalance < selectedDoctor.appointmentFee
                ? '⛔ Insufficient Balance — Add Money First'
                : 'Confirm Booking'}
            </button>
          </form>
        </section>

        {/* Right Column: Profile & Wallet */}
        <div className="space-y-8">
          {/* Profile Card */}
          <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span> My Profile
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Name</p>
                <p className="font-semibold text-gray-700">{user.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Email</p>
                <p className="font-semibold text-gray-700 truncate">{user.email}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Phone</p>
                <p className="font-semibold text-gray-700">{user.phone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Member Since</p>
                <p className="font-semibold text-gray-700">2024</p>
              </div>
            </div>
          </section>

          {/* Wallet Card */}
          <section className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-400 text-sm font-medium">Wallet Balance</p>
                <h4 className="text-4xl font-bold">₹ {user.walletBalance.toFixed(2)}</h4>
              </div>
              <span className="text-3xl opacity-50">💳</span>
            </div>

            <form onSubmit={handleWalletSubmit} className="space-y-3 pt-4 border-t border-white/10">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Top Up Request</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={walletData.amount}
                  onChange={(e) => setWalletData({ ...walletData, amount: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:bg-white/20"
                  required
                />
                <input
                  type="text"
                  placeholder="UTR Number"
                  value={walletData.utr}
                  onChange={(e) => setWalletData({ ...walletData, utr: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:bg-white/20"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 font-bold transition-all text-sm"
              >
                Request Add Money
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Appointments Table */}
      <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">📋</span> My Appointments
          </h3>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
            {userAppointments.length} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userAppointments.map(apt => {
                const doc = doctors.find(d => d.id === apt.doctorId);
                return (
                  <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{doc?.name}</p>
                      <p className="text-xs text-gray-400">{doc?.specialization}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-700">{apt.date}</p>
                      <p className="text-xs text-gray-400">{apt.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                        ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {apt.reason}
                    </td>
                  </tr>
                );
              })}
              {userAppointments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    No appointments booked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default UserPanel;
