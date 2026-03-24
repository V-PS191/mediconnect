import { useState } from 'react';
import type { Role, User, Doctor } from '../../types';

interface LoginFormProps {
  role: Role;
  onLogin: (role: Role, user: User | Doctor) => void;
  onBack: () => void;
  users: User[];
  doctors: Doctor[];
}

const LoginForm: React.FC<LoginFormProps> = ({ role, onLogin, onBack, users, doctors }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const displayRole = role === 'user' ? 'Patient' : role === 'admin' ? 'Reception' : 'Doctor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Demo admin bypass
    if (role === 'admin' && username === 'admin' && password === 'admin') {
      const demoAdmin: User = { id: 999, name: 'System Admin', username: 'admin', password: 'admin', email: 'admin@mediconnect.com', phone: '000-0000', walletBalance: 0, role: 'admin', address: 'System' };
      onLogin(role, demoAdmin);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      
      if (!response.ok) {
        // Fallback to local data if seeded user isn't in DB for some reason
        let localUser: User | Doctor | undefined;
        if (role === 'doctor') {
          localUser = doctors.find(d => d.username === username && d.password === password);
        } else {
          localUser = users.find(u => u.username === username && u.password === password && (!u.role || u.role === role));
        }

        if (localUser) {
          onLogin(role, localUser);
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Invalid username or password for this role.');
        return;
      }
      
      const foundUser = await response.json();
      onLogin(role, foundUser);
    } catch (err) {
      console.error("Login API failed:", err);
      setError("Could not connect to the database server.");
    }
  };

  return (
    <div className="w-full animate-fade-in max-w-lg mx-auto">
      <h2 className="text-3xl font-normal text-gray-500 mb-10 text-center capitalize">Login as {displayRole}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 text-sm"
            placeholder="Username *"
            required
            autoFocus
          />
        </div>
        
        <div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 text-sm"
            placeholder="Password *"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm px-2 text-center">{error}</p>}

        {role === 'admin' && (
          <p className="text-xs text-gray-400 text-center mt-2">Demo Admin Login: admin / admin</p>
        )}
        {role === 'user' && (
          <p className="text-xs text-gray-400 text-center mt-2">Demo Patient Login: user1 / user1</p>
        )}
        {role === 'doctor' && (
          <p className="text-xs text-gray-400 text-center mt-2">Demo Doctor Login: doctor1 / doctor1</p>
        )}

        <div className="flex flex-col-reverse md:flex-row items-center justify-between pt-6 gap-4">
          <button 
            type="button" 
            onClick={onBack}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Role
          </button>
          <button 
            type="submit"
            className="w-full md:w-auto px-12 py-3 rounded-full font-bold text-white bg-blue-700 hover:bg-blue-800 hover:shadow-lg transition-all active:scale-95 text-sm"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};
export default LoginForm;
