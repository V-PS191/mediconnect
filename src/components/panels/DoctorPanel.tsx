import React from 'react';
import { useState } from 'react';
import type { User, Doctor, Appointment } from '../../types';

interface DoctorPanelProps {
  doctor: Doctor;
  appointments: Appointment[];
  users: User[];
  onUpdateStatus: (aptId: number, status: Appointment['status']) => void;
  onModifyAppointment: (aptId: number, newDate: string, newTime: string) => void;
  onDelayAppointment: (aptId: number) => void;
}

const DoctorPanel: React.FC<DoctorPanelProps> = ({
  doctor,
  appointments,
  users,
  onUpdateStatus,
  onModifyAppointment,
  onDelayAppointment
}) => {
  const [modifyingApt, setModifyingApt] = useState<number | null>(null);
  const [modData, setModData] = useState({ date: '', time: '' });

  const myApts = appointments
    .filter(a => a.doctorId === doctor.id)
    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());

  const upcomingApts = myApts.filter(a => a.status === 'confirmed' || a.status === 'rescheduled' || a.status === 'pending');

  const handleModifyClick = (apt: Appointment) => {
    setModifyingApt(apt.id);
    setModData({ date: apt.date, time: apt.time });
  };

  const handleModifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modifyingApt) {
      onModifyAppointment(modifyingApt, modData.date, modData.time);
      setModifyingApt(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-800">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Patients</p>
          <p className="text-3xl font-bold">{new Set(myApts.map(a => a.userId)).size}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Upcoming Today</p>
          <p className="text-3xl font-bold">{upcomingApts.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500">
          <p className="text-xs font-bold text-gray-400 uppercase">Completed</p>
          <p className="text-3xl font-bold">{myApts.filter(a => a.status === 'completed').length}</p>
        </div>
      </div>

      {modifyingApt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-zoom-in">
            <h4 className="text-xl font-bold mb-4">Modify Appointment</h4>
            <form onSubmit={handleModifySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">New Date</label>
                  <input 
                    type="date"
                    value={modData.date}
                    onChange={(e) => setModData({...modData, date: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">New Time</label>
                  <input 
                    type="time"
                    value={modData.time}
                    onChange={(e) => setModData({...modData, time: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg">Save Changes</button>
                <button type="button" onClick={() => setModifyingApt(null)} className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Appointment Management</h3>
          <p className="text-xs text-indigo-500 font-bold bg-indigo-50 px-3 py-1 rounded-full uppercase">Queue View</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {upcomingApts.map((apt) => {
                const user = users.find(u => u.id === apt.userId);

                return (
                  <tr key={apt.id} className="hover:bg-gray-50/50 group transition-all">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        apt.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        apt.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' : 
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{user?.name}</p>
                      <p className="text-[10px] opacity-50">ID: {apt.userId}</p>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {apt.date.split('-').reverse().join('/')} at <span className="text-indigo-600">{apt.time}</span>
                    </td>
                    <td className="px-6 py-4 italic opacity-70 truncate max-w-[150px]">{apt.reason}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {apt.status === 'pending' && (
                          <button 
                            onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                            className="bg-indigo-600 text-white px-2 py-1 rounded-md font-bold text-[10px] hover:shadow-lg transition-all"
                          >
                            Confirm
                          </button>
                        )}
                        {(apt.status === 'confirmed' || apt.status === 'rescheduled') && (
                          <button 
                            onClick={() => onUpdateStatus(apt.id, 'completed')}
                            className="bg-emerald-600 text-white px-2 py-1 rounded-md font-bold text-[10px] hover:shadow-lg transition-all"
                          >
                            Done
                          </button>
                        )}
                        <button 
                          onClick={() => handleModifyClick(apt)}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold text-[10px] hover:bg-blue-200 transition-all"
                        >
                          Modify
                        </button>
                        {upcomingApts.length > 1 && (
                          <button 
                            onClick={() => onDelayAppointment(apt.id)}
                            className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold text-[10px] hover:bg-amber-200 transition-all flex items-center gap-1"
                            title="Delayed: Move down the queue"
                          >
                            Delay ⬇️
                          </button>
                        )}
                        <button 
                          onClick={() => onUpdateStatus(apt.id, 'noShow')}
                          className="text-gray-400 hover:text-rose-500 px-2 py-1 font-bold text-[10px] transition-all"
                        >
                          No Show
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {upcomingApts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No scheduled appointments.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DoctorPanel;
