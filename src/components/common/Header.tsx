import type { User, Doctor } from '../../types';

interface HeaderProps {
  currentUser: User | Doctor | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  if (!currentUser) return null;

  return (
    <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 shadow-lg rounded-b-xl flex justify-between items-center animate-fade-in-down">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span className="text-4xl">🏥</span> MediConnect
        </h1>
        <p className="text-sm opacity-80 italic">Your Health, Connected</p>
      </div>
      <div className="text-right flex flex-col items-end gap-2">
        <p className="font-semibold text-lg">Welcome, {currentUser.name}</p>
        <button 
          onClick={onLogout}
          className="bg-white/20 border-2 border-white hover:bg-white hover:text-indigo-600 px-4 py-1 rounded-lg font-bold transition-all active:scale-95"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
