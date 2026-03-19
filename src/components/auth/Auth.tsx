import { useState } from 'react';
import type { Role, User, Doctor } from '../../types';
import RoleSelection from './RoleSelection';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthProps {
  onLogin: (role: Role, user: User | Doctor) => void;
  users: User[];
  doctors: Doctor[];
  onSignup: (newUser: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, users, doctors, onSignup }) => {
  const [view, setView] = useState<'roles' | 'login' | 'signup'>('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setView('login');
  };

  const handleBack = () => {
    setView('roles');
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      {view === 'roles' && <RoleSelection onSelectRole={handleSelectRole} />}
      
      {view === 'login' && selectedRole && (
        <LoginForm 
          role={selectedRole}
          onLogin={onLogin}
          onBack={handleBack}
          onShowSignup={() => setView('signup')}
          users={users}
          doctors={doctors}
        />
      )}
      
      {view === 'signup' && (
        <SignupForm 
          onSignup={(newUser) => {
            onSignup(newUser);
            setView('login');
          }}
          onBack={() => setView('login')}
        />
      )}
    </div>
  );
};

export default Auth;
