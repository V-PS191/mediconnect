import React, { useState } from 'react';
import type { User, Doctor, Appointment, PaymentRequest, Transaction } from '../../types';
import { getRelativeDate } from '../../utils/dateUtils';

interface UserPanelProps {
  user: User;
  doctors: Doctor[];
  appointments: Appointment[];
  paymentRequests: PaymentRequest[];
  onBookAppointment: (appointment: Appointment) => void;
  onRequestMoney: (amount: number, utr: string) => void;
  onLogout: () => void;
  transactions: Transaction[];
}

type ViewState = 'book' | 'upcoming' | 'history' | 'wallet' | 'prescriptions' | 'profile';

const UserPanel: React.FC<UserPanelProps> = ({
  user,
  doctors,
  appointments,
  transactions,
  onBookAppointment,
  onRequestMoney,
  onLogout
}) => {
  const [currentView, setCurrentView] = useState<ViewState>('book');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);

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

  const upcomingApts = userAppointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const historyApts = userAppointments.filter(a => ['completed', 'rescheduled', 'noShow'].includes(a.status));

  const userTransactions = transactions
    .filter(t => t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Get selected doctor for live fee display
  const selectedDoctor = bookingData.doctorId
    ? doctors.find(d => d.id === parseInt(bookingData.doctorId))
    : null;

  // Generate available time slots based on selected date and doctor
  const getAvailableTimeSlots = () => {
    if (!bookingData.date || !bookingData.doctorId) return [];
    
    // All possible slots from 09:00 to 17:00 at 15-min intervals
    const allSlots = [];
    for (let hour = 9; hour <= 17; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour !== 17) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:15`);
        allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        allSlots.push(`${hour.toString().padStart(2, '0')}:45`);
      }
    }

    // Slots already booked for this user on this date
    const userBookedTimes = appointments
      .filter(a => a.userId === user.id && a.date === bookingData.date)
      .map(a => a.time);

    // Slots already booked for the selected doctor on this date
    const doctorBookedTimes = appointments
      .filter(a => a.doctorId === parseInt(bookingData.doctorId) && a.date === bookingData.date)
      .map(a => a.time);

    return allSlots.filter(slot => !userBookedTimes.includes(slot) && !doctorBookedTimes.includes(slot));
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    const doctor = doctors.find(d => d.id === parseInt(bookingData.doctorId));
    if (!doctor) return;

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
      notes: reportFile ? `Attached report: ${reportFile.name}` : ''
    };
    onBookAppointment(newApt);
    setBookingData({ doctorId: '', date: '', time: '', reason: '' });
    setReportFile(null);
    setCurrentView('upcoming'); // Redirect to upcoming after booking
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestMoney(parseFloat(walletData.amount), walletData.utr);
    setWalletData({ amount: '', utr: '' });
  };

  const menuItems = [
    { id: 'book', label: 'Book Appointment', icon: '📅' },
    { id: 'upcoming', label: 'Upcoming Appointments', icon: '⏳' },
    { id: 'history', label: 'Appointment History', icon: '📜' },
    { id: 'wallet', label: 'My Wallet', icon: '💳' },
    { id: 'prescriptions', label: 'My Prescriptions', icon: '💊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  const renderAppointmentTable = (apts: Appointment[], emptyMessage: string) => (
    <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">{currentView === 'upcoming' ? '⏳' : '📜'}</span> 
          {currentView === 'upcoming' ? 'Upcoming Appointments' : 'Appointment History'}
        </h3>
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
          {apts.length} Total
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
            {apts.map(apt => {
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
                        apt.status === 'noShow' ? 'bg-red-100 text-red-700' :
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
            {apts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="relative flex flex-col min-h-[80vh] font-sans">
      
      {/* Top Bar with Hamburger */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-slide-in-top">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-3 active:scale-95"
          >
            <span className="text-xl leading-none">☰</span>
            <span className="font-bold text-gray-700 hidden sm:inline">Menu</span>
          </button>
          <span className="font-bold text-lg text-indigo-700 hidden sm:inline border-l border-gray-200 pl-4">
            {menuItems.find(m => m.id === currentView)?.label}
          </span>
        </div>
        
        {/* Quick Profile Summary in header */}
        <div className="flex items-center gap-3 pr-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">Wallet: ₹ {user.walletBalance.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Hamburger Overlay/Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
          
          {/* Menu Panel */}
          <div className="relative w-80 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col pt-8 px-6 animate-slide-in-left">
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 p-2 bg-gray-50 rounded-full w-10 h-10 flex items-center justify-center">
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-8 pb-6 border-b border-gray-100 tracking-wide">Patient Menu</h2>
            
            <nav className="flex-1 space-y-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id as ViewState); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl font-bold transition-all ${currentView === item.id ? 'bg-indigo-50 text-indigo-700 scale-[1.02]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <button 
              onClick={onLogout} 
              className="mt-auto mb-10 w-full flex items-center gap-4 px-4 py-4 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-2xl">🚪</span>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Content Area */}
      <div className="flex-1">
        
        {/* --- BOOK APPOINTMENT & PROFILE --- */}
        {currentView === 'book' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Booking Card */}
            <section className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <span className="text-3xl">📅</span> Book an Appointment
              </h3>
              <form onSubmit={handleBookSubmit} className="space-y-6">
                {/* Error Banner */}
                {bookingError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                    <div>
                      <p className="text-red-700 font-bold text-sm">Booking Failed</p>
                      <p className="text-red-600 text-sm mt-1">{bookingError}</p>
                      <button type="button" onClick={() => setCurrentView('wallet')} className="text-red-700 text-xs mt-3 font-bold underline cursor-pointer hover:text-red-800">👉 Go to Wallet</button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Select Doctor</label>
                  <select
                    value={bookingData.doctorId}
                    onChange={(e) => { setBookingData({ ...bookingData, doctorId: e.target.value, time: '' }); setBookingError(null); }}
                    className="w-full p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
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

                {/* Live balance warning */}
                {selectedDoctor && user.walletBalance < selectedDoctor.appointmentFee && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <span className="text-amber-500 text-2xl">💰</span>
                    <p className="text-amber-700 text-sm">
                      <span className="font-bold block mb-1">Low Balance</span> Doctor fee is ₹{selectedDoctor.appointmentFee.toFixed(2)} but your wallet has ₹{user.walletBalance.toFixed(2)}. Add money to proceed.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Date</label>
                    <input
                      type="date"
                      min={getRelativeDate(1)}
                      value={bookingData.date}
                      onChange={(e) => { setBookingData({ ...bookingData, date: e.target.value, time: '' }); setBookingError(null); }}
                      className="w-full p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Time</label>
                    <select
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 disabled:opacity-50"
                      required
                      disabled={!bookingData.date || !bookingData.doctorId}
                    >
                      <option value="">-- Select Time --</option>
                      {getAvailableTimeSlots().map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Reason for Visit</label>
                  <textarea
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 h-28 bg-gray-50 resize-none mb-6"
                    placeholder="Describe your symptoms..."
                    required
                  />

                  <label className="block text-sm font-medium text-gray-600 mb-2">Attach Medical Report (PDF, Optional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                    className="w-full p-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-indigo-600 hover:file:bg-indigo-50 file:border file:border-indigo-100 transition-colors cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={selectedDoctor ? user.walletBalance < selectedDoctor.appointmentFee : false}
                  className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95
                    ${selectedDoctor && user.walletBalance < selectedDoctor.appointmentFee
                      ? 'bg-gray-400 cursor-not-allowed hidden shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                    }`}
                >
                  Confirm Booking
                </button>
              </form>
            </section>

            {/* Wallet Quick Widget */}
            <section className="bg-gradient-to-br from-indigo-900 to-gray-900 p-8 rounded-3xl shadow-xl text-white flex flex-col justify-start relative overflow-hidden">
               {/* Decorative background circle */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="text-indigo-200 text-sm font-medium tracking-wide mb-1 uppercase">Wallet Balance</p>
                  <h4 className="text-4xl font-black tracking-tight">₹ {user.walletBalance.toFixed(2)}</h4>
                </div>
                <span className="text-4xl opacity-20">💳</span>
              </div>

              <form onSubmit={handleWalletSubmit} className="space-y-4 pt-6 border-t border-white/10 relative z-10">
                <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Add Money Directly</p>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="number"
                    placeholder="Amount to add (₹)"
                    value={walletData.amount}
                    onChange={(e) => setWalletData({ ...walletData, amount: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:bg-white/10 focus:border-white/30 transition-all font-medium placeholder-indigo-200 text-white w-full"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Bank UTR Number"
                    value={walletData.utr}
                    onChange={(e) => setWalletData({ ...walletData, utr: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:bg-white/10 focus:border-white/30 transition-all font-medium placeholder-indigo-200 text-white w-full"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all shadow-md hover:shadow-indigo-500/30 active:scale-95 mt-2"
                >
                  Add Money
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/10 relative z-10 text-xs">
                <p className="font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-1"><span>🏦</span> Transfer Details</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-indigo-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="opacity-80">Holder</span>
                    <span className="font-bold text-white">MediConnect Ltd</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">A/C No.</span>
                    <span className="font-mono font-bold text-indigo-300">50200012345678</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">IFSC</span>
                    <span className="font-mono font-bold text-indigo-300">HDFC0001234</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --- UPCOMING APPOINTMENTS --- */}
        {currentView === 'upcoming' && renderAppointmentTable(upcomingApts, "You have no upcoming appointments.")}

        {/* --- APPOINTMENT HISTORY --- */}
        {currentView === 'history' && renderAppointmentTable(historyApts, "No past appointment history found.")}

        {/* --- WALLET --- */}
        {currentView === 'wallet' && (
          <div className="max-w-2xl mx-auto animate-fade-in space-y-8">
            <section className="bg-gradient-to-br from-indigo-900 to-gray-900 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
               {/* Decorative background circle */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                  <p className="text-indigo-200 text-sm font-medium tracking-wide mb-2 uppercase">Wallet Balance</p>
                  <h4 className="text-6xl font-black tracking-tight">₹ {user.walletBalance.toFixed(2)}</h4>
                </div>
                <span className="text-6xl opacity-20">💳</span>
              </div>

              <form onSubmit={handleWalletSubmit} className="space-y-4 pt-8 border-t border-white/10 relative z-10">
                <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">Add Money Directly</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Amount to add (₹)"
                    value={walletData.amount}
                    onChange={(e) => setWalletData({ ...walletData, amount: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:bg-white/10 focus:border-white/30 transition-all font-medium placeholder-indigo-200 text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Bank UTR Number"
                    value={walletData.utr}
                    onChange={(e) => setWalletData({ ...walletData, utr: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:bg-white/10 focus:border-white/30 transition-all font-medium placeholder-indigo-200 text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all text-lg shadow-lg hover:shadow-indigo-500/30 active:scale-95 mt-4"
                >
                  Add Money to Wallet
                </button>
              </form>
              
              <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-xl">🏦</span> Bank Transfer Details</p>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-indigo-100 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-sm opacity-80">Account Holder Name</span>
                    <span className="font-bold text-white tracking-wide">MediConnect Pvt Ltd</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-sm opacity-80">Bank Name</span>
                    <span className="font-bold text-white tracking-wide">HDFC Bank</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-sm opacity-80">Account Number</span>
                    <span className="font-mono font-bold text-indigo-300 tracking-wider">50200012345678</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-80">IFSC Code</span>
                    <span className="font-mono font-bold text-indigo-300 tracking-wider">HDFC0001234</span>
                  </div>
                </div>
                <p className="text-xs text-indigo-300/60 mt-4 italic text-center">Please transfer the amount to the above account and then enter the resulting UTR number to instantly add balance.</p>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-3xl">🧾</span> Recent Transactions
              </h3>
              <div className="space-y-4">
                {userTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 italic py-8">No transactions found.</p>
                ) : (
                  userTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md hover:bg-white">
                      <div>
                        <p className="font-bold text-gray-800">{tx.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                      </div>
                      <div className={`text-lg font-black ${tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* --- PRESCRIPTIONS --- */}
        {currentView === 'prescriptions' && (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm animate-fade-in max-w-2xl mx-auto mt-8">
            <span className="text-6xl block mb-6 opacity-80">💊</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">My Prescriptions</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Access medical prescriptions and doctors' notes generated from your past visits.</p>
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 italic font-medium">
              No previous prescriptions found.
            </div>
          </div>
        )}

        {/* --- PROFILE FULL VIEW --- */}
        {currentView === 'profile' && (
          <div className="max-w-2xl mx-auto animate-fade-in mt-8">
            <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-start">
              <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                <span className="text-4xl">👤</span> My Profile Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Full Name</p>
                  <p className="font-black text-gray-800 text-xl">{user.name}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Email Address</p>
                  <p className="font-bold text-gray-800 text-lg truncate">{user.email}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Phone Number</p>
                  <p className="font-bold text-gray-800 text-lg">{user.phone}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Postal Address</p>
                  <p className="font-bold text-gray-800 text-lg truncate">{user.address || 'Not Provided'}</p>
                </div>
              </div>
            </section>
          </div>
        )}

      </div>

    </div>
  );
};

export default UserPanel;
