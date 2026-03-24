import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError('');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateMobile = (val: string) => {
    if (!val) {
      setMobileError('');
      return false;
    }
    if (!/^\d{10}$/.test(val)) {
      setMobileError('Mobile number must be exactly 10 digits.');
      return false;
    }
    setMobileError('');
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError('');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*!]).{8,16}$/.test(val)) {
      setPasswordError('Password must be 8–16 characters and include uppercase, lowercase, number, and special character.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (val: string, pass: string) => {
    if (!val) {
      setConfirmPasswordError('');
      return false;
    }
    if (val !== pass) {
      setConfirmPasswordError('Passwords do not match. Please try again.');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    validateEmail(val);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMobile(val);
    validateMobile(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    validatePassword(val);
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, val);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    validateConfirmPassword(val, password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    const isMobileValid = validateMobile(mobile);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password);

    if (!isEmailValid || !isMobileValid || !isPasswordValid || !isConfirmPasswordValid || !firstName || !lastName) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      if (existingUsers.some((u: any) => u.email === email || u.mobile === mobile)) {
        throw new Error('User with this email or mobile already exists.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
      
      const mockUser = {
        uid: 'user-' + Date.now(),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        mobile,
        password: btoa(password), // Simple encoding for demo purposes
        language: 'en',
        createdAt: new Date().toISOString(),
      };

      existingUsers.push(mockUser);
      localStorage.setItem('app_users', JSON.stringify(existingUsers));

      setSuccessMessage('Account Created Successfully');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#050a1f] justify-center overflow-y-auto relative min-h-screen">
      {/* Background Effects */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"
      />

      <AnimatePresence>
        {successMessage ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050a1f]/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <CheckCircle className="w-24 h-24 text-neon-green mb-4 drop-shadow-[0_0_15px_rgba(0,255,102,0.8)]" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white tracking-wide neon-text-green">{successMessage}</h2>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 mt-8 relative z-10"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-panel border border-neon-green/30 text-neon-green mb-4 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
          <UserPlus className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-wide neon-text-green">{t('auth.signup')}</h2>
        <p className="text-gray-400 mt-2 tracking-wide">{t('app.title')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10"
      >
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-4 text-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">First Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,102,0.2)] text-white outline-none transition-all"
                  placeholder="First Name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">Last Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,102,0.2)] text-white outline-none transition-all"
                  placeholder="Last Name"
                />
              </div>
            </div>
          </div>

          <motion.div animate={emailError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
            <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border ${emailError ? 'border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,102,0.2)]'} text-white outline-none transition-all`}
                placeholder="Enter your email address"
              />
            </div>
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </motion.div>

          <motion.div animate={mobileError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
            <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">{t('auth.mobile')}</label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={handleMobileChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border ${mobileError ? 'border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,102,0.2)]'} text-white outline-none transition-all`}
                placeholder="10-digit mobile number"
              />
            </div>
            {mobileError && <p className="text-red-500 text-xs mt-1">{mobileError}</p>}
          </motion.div>

          <motion.div animate={passwordError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
            <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={handlePasswordChange}
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-black/40 border ${passwordError ? 'border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,102,0.2)]'} text-white outline-none transition-all`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-green focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </motion.div>

          <motion.div animate={confirmPasswordError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }}>
            <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-black/40 border ${confirmPasswordError ? 'border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,102,0.2)]'} text-white outline-none transition-all`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-green focus:outline-none transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPasswordError && <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>}
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || !!emailError || !!mobileError || !!passwordError || !!confirmPasswordError || !email || !mobile || !password || !confirmPassword || !firstName || !lastName}
            className="w-full bg-neon-green/10 text-neon-green py-3 rounded-xl font-bold hover:bg-neon-green/20 transition-all disabled:opacity-50 mt-4 border border-neon-green shadow-[0_0_15px_rgba(0,255,102,0.3)] tracking-wide relative overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              t('auth.signup')
            )}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400 pb-6">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-neon-green font-bold hover:text-white transition-colors tracking-wide">
            {t('auth.login')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
