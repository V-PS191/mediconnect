import type { Role } from '../../types';

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gray-100 animate-zoom-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to MediConnect</h2>
      <p className="text-gray-500 mb-8">Select your role to continue</p>
      
      <div className="space-y-4">
        <button 
          onClick={() => onSelectRole('user')}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>👤</span> Login as User
        </button>
        
        <button 
          onClick={() => onSelectRole('admin')}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-rose-400 to-rose-600 hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>👨‍💼</span> Login as Admin
        </button>
        
        <button 
          onClick={() => onSelectRole('doctor')}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-400 to-cyan-600 hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>👨‍⚕️</span> Login as Doctor
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 text-left space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Demo Credentials</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <p><span className="font-semibold">Admin:</span> admin/admin</p>
          <p><span className="font-semibold">User:</span> user1/user1</p>
          <p><span className="font-semibold">Doctor:</span> doctor1/doctor1</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
