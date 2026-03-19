import { useState } from 'react';
import type { Role, User, Doctor } from '../../types';

interface LoginFormProps {
  role: Role;
  onLogin: (role: Role, user: User | Doctor) => void;
  onBack: () => void;
  onShowSignup: () => void;
  users: User[];
  doctors: Doctor[];
}

const LoginForm: React.FC<LoginFormProps> = ({ role, onLogin, onBack, onShowSignup, users, doctors }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let foundUser: User | Doctor | undefined;

    if (role === 'admin') {
      if (username === 'admin' && password === 'admin') {
        foundUser = { id: 0, name: 'Admin', username: 'admin', email: 'admin@mediconnect.com', phone: '', walletBalance: 0 };
      }
    } else if (role === 'doctor') {
      foundUser = doctors.find(d => d.username === username && d.password === password);
    } else {
      foundUser = users.find(u => u.username === username && u.password === password);
    }

    if (foundUser) {
      onLogin(role, foundUser);
    } else {
      setError('Invalid username or password for this role.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 animate-slide-in-right">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center capitalize">{role} Login</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            required
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button 
          type="submit"
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95"
        >
          Login
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        <button 
          onClick={onBack}
          className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          ← Back to Role Selection
        </button>
        
        {role === 'user' && (
          <button 
            onClick={onShowSignup}
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            Don't have an account? Sign Up
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
