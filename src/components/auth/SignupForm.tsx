import { useState } from 'react';
import type { Role, User, Doctor } from '../../types';

interface SignupFormProps {
  role: Role;
  onSignup: (newUser: User) => void;
  onSignupDoctor: (newDoctor: Doctor) => void;
  onBack: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ role, onSignup, onSignupDoctor, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    address: '',
    specialization: '',
    appointmentFee: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    lunchStart: '13:00',
    lunchEnd: '14:00',
    offDays: [] as number[],
  });

  const [otpStep, setOtpStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const displayRole = role === 'user' ? 'Patient' : role === 'admin' ? 'Reception' : 'Doctor';

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              setFormData(prev => ({ ...prev, address: data.display_name }));
            } else {
              alert("Could not determine address from location.");
            }
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          alert("Failed to get address.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve location.");
        setIsLocating(false);
      }
    );
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!otpStep) {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      setOtpStep(true);
      setTimeout(() => {
        window.alert(`[MOCK SMS MESSAGE]\n\nYour MediConnect Verification Code is: ${mockOtp}\n\nDo not share this code with anyone.`);
      }, 500);
      return;
    }

    if (otpValue !== generatedOtp) {
      setOtpError('Invalid OTP code. Please check your SMS and try again.');
      return;
    }
    
    setOtpError('');
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const registerUser = async (payload: any, isDoctor: boolean) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          alert(`Registration failed: ${errorData.message}`);
          return;
        }
        
        const data = await response.json();
        if (data._id && !data.id) {
          data.id = data._id;
        }

        if (isDoctor) {
          onSignupDoctor(data);
        } else {
          onSignup(data);
        }
      } catch (err) {
        console.error("Error registering:", err);
        alert("Server error during registration.");
      }
    };

    if (role === 'doctor') {
      const newDoctor: Doctor = {
        id: Date.now(),
        name: fullName,
        username: formData.username,
        password: formData.password,
        specialization: formData.specialization,
        phone: formData.phone,
        appointmentFee: Number(formData.appointmentFee) || 500,
        shiftStart: formData.shiftStart,
        shiftEnd: formData.shiftEnd,
        lunchStart: formData.lunchStart,
        lunchEnd: formData.lunchEnd,
        address: formData.address,
        offDays: formData.offDays
      };
      
      registerUser({ ...newDoctor, role: 'doctor' }, true);
    } else {
      const newUserPayload = {
        name: fullName,
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        walletBalance: 0,
        role: role === 'admin' ? 'admin' : 'user'
      };
      registerUser(newUserPayload, false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOffDayChange = (day: number) => {
    setFormData(prev => {
      const offDays = prev.offDays.includes(day)
        ? prev.offDays.filter(d => d !== day)
        : [...prev.offDays, day];
      return { ...prev, offDays };
    });
  };

  return (
    <div className="w-full animate-fade-in mx-auto">
      <h2 className="text-3xl font-medium text-gray-500 mb-10 text-center capitalize">Register as {displayRole}</h2>
      
      <form onSubmit={handleInitialSubmit} className="space-y-5">
        
        {!otpStep ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="First Name *" required />
              </div>
              <div>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Last Name *" required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Your Email *" required />
              </div>
              <div>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Your Phone *" required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Username *" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Password *" required minLength={4} />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Confirm Password *" required minLength={4} />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <div className="flex items-center gap-6 px-2 text-sm text-gray-600 font-medium pb-2">
              <label className="flex items-center gap-2 cursor-pointer relative group">
                <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                <span>Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer relative group">
                <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                <span>Female</span>
              </label>
            </div>

            {role !== 'admin' && (
              <div>
                <div className="flex justify-between items-end mb-1 px-3">
                   <button type="button" onClick={handleGetLocation} className={`text-xs font-bold flex items-center gap-1 transition-colors ${isLocating ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`} disabled={isLocating}>
                    <span>📍</span> {isLocating ? 'Locating...' : 'Use Current Location'}
                  </button>
                </div>
                <textarea name="address" value={formData.address} onChange={handleChange} className="w-full px-5 py-3 rounded-3xl border border-gray-200 focus:border-blue-500 outline-none text-sm resize-none h-20 placeholder-gray-400 text-gray-700 font-medium" placeholder="Address *" required />
              </div>
            )}

            {role === 'doctor' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Specialization *" required />
                  <input type="number" name="appointmentFee" value={formData.appointmentFee} onChange={handleChange} className="w-full px-5 py-3 rounded-full border border-gray-200 text-sm placeholder-gray-400 text-gray-700 font-medium" placeholder="Fee (₹) *" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2"><span className="text-xs text-gray-400 font-medium">Shift Start</span><input type="time" name="shiftStart" value={formData.shiftStart} onChange={handleChange} className="w-full px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600" required /></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-gray-400 font-medium">Shift End</span><input type="time" name="shiftEnd" value={formData.shiftEnd} onChange={handleChange} className="w-full px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600" required /></div>
                </div>
                <div className="pt-2 pl-1">
                  <p className="text-xs font-medium text-gray-500 mb-2">Select Off Days</p>
                  <div className="flex flex-wrap gap-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.offDays.includes(idx)}
                          onChange={() => handleOffDayChange(idx)}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs text-gray-600 font-medium">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col-reverse md:flex-row items-center justify-between pt-6 gap-4 px-1">
              <button type="button" onClick={onBack} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                ← Back to Role
              </button>
              <button type="submit" className="w-full md:w-auto px-14 py-3 rounded-full font-bold text-white bg-blue-700 hover:bg-blue-800 hover:shadow-lg transition-all active:scale-95 text-sm">
                Register
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-zoom-in max-w-sm mx-auto pt-4 shadow-2xl p-8 rounded-3xl border border-gray-100">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
              <span className="text-4xl mb-3 block">📱</span>
              <p className="text-sm text-blue-900">We've sent a 6-digit verification code to<br/><strong className="font-bold">{formData.phone}</strong></p>
            </div>
            
            <div>
              <input type="text" maxLength={6} value={otpValue} onChange={(e) => { setOtpValue(e.target.value); setOtpError(''); }} className="w-full px-4 py-4 rounded-xl border-2 border-blue-200 focus:border-blue-600 outline-none text-center text-3xl tracking-[0.5em] font-bold text-gray-800" placeholder="------" required autoFocus />
            </div>
            
            {otpError && <p className="text-red-500 text-sm text-center font-medium">{otpError}</p>}
            
            <button type="submit" className="w-full py-4 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95">
              Verify & Complete
            </button>
            
            <button type="button" onClick={() => { setOtpStep(false); setOtpValue(''); setOtpError(''); }} className="w-full py-2 text-blue-500 hover:text-blue-700 font-bold transition-colors text-sm">
              Change Phone Number
            </button>
          </div>
        )}

      </form>
    </div>
  );
};
export default SignupForm;
