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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [view, setView] = useState<'login' | 'forgot_otp' | 'forgot_reset'>('login');
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [targetUser, setTargetUser] = useState<User | Doctor | null>(null);

  const displayRole = role === 'user' ? 'Patient' : role === 'admin' ? 'Reception' : 'Doctor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');

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
      if (foundUser._id && !foundUser.id) {
        foundUser.id = foundUser._id;
      }
      onLogin(role, foundUser);
    } catch (err) {
      console.error("Login API failed:", err);
      setError("Could not connect to the database server.");
    }
  };

  const handleForgotPasswordInitiate = () => {
    if (!username) {
      setError("Please enter your username above first to reset password.");
      return;
    }
    setError('');
    setForgotSuccess('');
    
    let found: User | Doctor | undefined;
    if (role === 'doctor') {
      found = doctors.find(d => d.username === username);
    } else {
      found = users.find(u => u.username === username && (!u.role || u.role === role));
    }
    
    setTargetUser(found || null);

    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    setView('forgot_otp');
    setOtpValue('');
    setForgotError('');
    
    setTimeout(() => {
      window.alert(`[MOCK SMS MESSAGE]\n\nYour MediConnect Password Reset Code is: ${mockOtp}\n\nDo not share this code with anyone.`);
    }, 500);
  };

  if (view === 'forgot_otp') {
    return (
      <div className="w-full animate-fade-in max-w-sm mx-auto pt-4">
        <h2 className="text-3xl font-medium text-gray-500 mb-6 text-center">Verify Identity</h2>
        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center mb-6">
          <span className="text-4xl mb-3 block">📱</span>
          <p className="text-sm text-blue-900">
            We've sent a 6-digit verification code to {targetUser ? (role === 'doctor' ? 'your registered contact' : ('email: ' + ((targetUser as User).email || 'on file'))) : 'the registered mobile/email'} for username <strong className="font-bold">{username}</strong>.
          </p>
        </div>
        
        <div>
          <input type="text" maxLength={6} value={otpValue} onChange={(e) => { setOtpValue(e.target.value); setForgotError(''); }} className="w-full px-4 py-4 rounded-xl border-2 border-blue-200 focus:border-blue-600 outline-none text-center text-3xl tracking-[0.5em] font-bold text-gray-800 mb-4" placeholder="------" required autoFocus />
        </div>
        
        {forgotError && <p className="text-red-500 text-sm text-center font-medium mb-4">{forgotError}</p>}
        
        <button type="button" onClick={() => {
          if (otpValue === generatedOtp) { setView('forgot_reset'); setForgotError(''); }
          else setForgotError('Invalid OTP code. Please try again.');
        }} className="w-full py-4 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 mb-3">
          Verify Code
        </button>
        <button type="button" onClick={() => setView('login')} className="w-full py-2 text-blue-500 hover:text-blue-700 font-bold transition-colors text-sm">
          Cancel Reset
        </button>
      </div>
    );
  }

  if (view === 'forgot_reset') {
    return (
      <div className="w-full animate-fade-in max-w-sm mx-auto pt-4">
        <h2 className="text-3xl font-medium text-gray-500 mb-6 text-center">Reset Password</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (newPassword !== confirmNewPassword) { setForgotError('Passwords do not match'); return; }
          try {
            const res = await fetch('http://localhost:5000/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, newPassword, role })
            });
            if (res.ok) {
              setForgotSuccess('Password successfully changed! You can now login.');
              setView('login');
              setPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
            } else {
              const err = await res.json().catch(()=>({}));
              setForgotError(err.message || 'Failed to update password');
            }
          } catch(err) { setForgotError('Connection error to server'); }
        }} className="space-y-5">
          <div>
            <input type="password" value={newPassword} onChange={e => {setNewPassword(e.target.value); setForgotError('');}} placeholder="New Password *" required minLength={4} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm" autoFocus />
          </div>
          <div>
            <input type="password" value={confirmNewPassword} onChange={e => {setConfirmNewPassword(e.target.value); setForgotError('');}} placeholder="Confirm New Password *" required minLength={4} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
          </div>
          {forgotError && <p className="text-red-500 text-sm align-center text-center">{forgotError}</p>}
          <button type="submit" className="w-full py-3 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 mt-4">
            Save New Password
          </button>
          <button type="button" onClick={() => setView('login')} className="w-full py-2 text-gray-500 hover:text-gray-700 font-bold transition-colors text-sm text-center">
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in max-w-lg mx-auto">
      <h2 className="text-3xl font-normal text-gray-500 mb-10 text-center capitalize">Login as {displayRole}</h2>
      
      {forgotSuccess && <p className="text-emerald-600 bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-6 text-sm text-center font-medium">{forgotSuccess}</p>}
      
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
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 text-sm"
              placeholder="Password *"
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="text-right mt-2 px-2">
            <button type="button" onClick={handleForgotPasswordInitiate} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">Forgot Password?</button>
          </div>
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
