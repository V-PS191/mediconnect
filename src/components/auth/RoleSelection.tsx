import type { Role } from '../../types';

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
  onBack: () => void;
  title: string;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole, onBack, title }) => {
  return (
    <div className="w-full animate-fade-in max-w-sm mx-auto text-center pt-8">
      <h2 className="text-3xl font-normal text-gray-500 mb-10">{title}</h2>
      
      <div className="space-y-4">
        <button 
          onClick={() => onSelectRole('user')}
          className="w-full py-4 rounded-full font-bold text-blue-700 bg-white border-2 border-blue-700 mx-auto hover:bg-blue-50 transition-all active:scale-95"
        >
          Patient
        </button>
        <button 
          onClick={() => onSelectRole('doctor')}
          className="w-full py-4 rounded-full font-bold text-blue-700 bg-white border-2 border-blue-700 mx-auto hover:bg-blue-50 transition-all active:scale-95"
        >
          Doctor
        </button>
        <button 
          onClick={() => onSelectRole('admin')}
          className="w-full py-4 rounded-full font-bold text-blue-700 bg-white border-2 border-blue-700 mx-auto hover:bg-blue-50 transition-all active:scale-95"
        >
          Reception
        </button>
      </div>

      <button onClick={onBack} className="w-full mt-10 py-2 text-sm font-medium text-blue-600 hover:underline">
        ← Back
      </button>

      {title.includes('Sign In') && (
        <div className="mt-8 pt-6 border-t border-gray-100 text-left space-y-2 opacity-50 hover:opacity-100 transition-opacity">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Demo Credentials</p>
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <p>Rec: admin / admin</p>
            <p>Pat: user1 / user1</p>
            <p>Doc: doctor1 / doctor1</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelection;
