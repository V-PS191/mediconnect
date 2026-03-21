import { useState } from 'react';
import type { Role, User, Doctor } from '../../types';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import RoleSelection from './RoleSelection';

interface AuthProps {
  onLogin: (role: Role, user: User | Doctor) => void;
  users: User[];
  doctors: Doctor[];
  onSignup: (newUser: User) => void;
  onSignupDoctor: (newDoctor: Doctor) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, users, doctors, onSignup, onSignupDoctor }) => {
  const [view, setView] = useState<'landing' | 'loginRoles' | 'login' | 'signupRoles' | 'signup'>('landing');
  const [selectedRole, setSelectedRole] = useState<Role>('user');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-400 flex flex-col md:flex-row relative font-sans">
      
      {/* Header Navbar */}
      <header className="absolute top-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-xl font-bold tracking-wide pl-4 text-white">
          <span className="text-2xl">+</span>
          <span>GLOBAL HOSPITALS</span>
        </div>
        {/* Nav Links made black */}
        <nav className="hidden md:flex gap-10 text-xs font-bold tracking-wider uppercase pr-10 text-black">
          <a href="#" className="hover:text-blue-800 transition-colors">Home</a>
          <a href="#" className="hover:text-blue-800 transition-colors">About Us</a>
          <a href="#" className="hover:text-blue-800 transition-colors">Top Doctors</a>
          <a href="#" className="hover:text-blue-800 transition-colors">Contact</a>
        </nav>
      </header>

      {/* Left Side: Welcome */}
      <div className="hidden md:flex flex-col justify-center items-center w-5/12 text-white pt-20">
        <span className="text-7xl mb-6">🚀</span>
        <h1 className="text-4xl font-normal tracking-wide">Welcome</h1>
      </div>

      {/* Right Side: The White Card */}
      <div className="w-full md:w-7/12 bg-white md:rounded-l-[4rem] p-8 md:p-16 flex flex-col justify-center min-h-screen pt-28 shadow-2xl relative">
        <div className="w-full max-w-2xl mx-auto">
          
          {view === 'landing' && (
            <div className="animate-fade-in text-center space-y-8 max-w-sm mx-auto pt-10">
              <h2 className="text-4xl font-normal text-gray-500 mb-12">Get Started</h2>
              
              <button 
                onClick={() => setView('loginRoles')} 
                className="w-full py-4 rounded-full font-bold text-white bg-blue-700 hover:bg-blue-800 transition-all shadow-md active:scale-95"
              >
                Sign In
              </button>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400">or</span></div>
              </div>
              
              <button 
                onClick={() => setView('signupRoles')} 
                className="w-full py-4 rounded-full font-bold text-blue-700 bg-white border-2 border-blue-700 hover:bg-blue-50 transition-all shadow-sm active:scale-95"
              >
                Create Account
              </button>
            </div>
          )}

          {view === 'loginRoles' && (
            <RoleSelection 
              title="Sign In As" 
              onSelectRole={(r) => { setSelectedRole(r); setView('login'); }} 
              onBack={() => setView('landing')} 
            />
          )}

          {view === 'signupRoles' && (
            <RoleSelection 
              title="Register As" 
              onSelectRole={(r) => { setSelectedRole(r); setView('signup'); }} 
              onBack={() => setView('landing')} 
            />
          )}

          {view === 'login' && (
            <LoginForm 
              role={selectedRole} 
              onLogin={onLogin} 
              onBack={() => setView('loginRoles')} 
              users={users} 
              doctors={doctors} 
            />
          )}

          {view === 'signup' && (
            <SignupForm 
              role={selectedRole} 
              onSignup={(newUser) => { onSignup(newUser); setView('login'); }} 
              onSignupDoctor={(newDoctor) => { onSignupDoctor(newDoctor); setView('login'); }} 
              onBack={() => setView('signupRoles')} 
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default Auth;
