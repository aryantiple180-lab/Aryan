import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogIn, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login } = useAuth();

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError('');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError('');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (error) setError('');
    validateEmail(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (error) setError('');
    validatePassword(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const storedUsers = localStorage.getItem('app_users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      const user = users.find((u: any) => u.email === email || u.mobile === email);
      
      if (!user) {
        setError('User not found');
        setLoading(false);
        return;
      }
      
      // Basic password check (in a real app, use bcrypt)
      if (user.password !== btoa(password)) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Wait for success animation
      setTimeout(() => {
        login({ uid: user.id || 'mock-uid-' + Date.now(), email: user.email, displayName: user.firstName + ' ' + user.lastName });
        navigate('/');
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      // Mock Google login
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const email = 'googleuser@example.com';
      let displayName = 'Google User';
      const storedProfile = localStorage.getItem('user_profile');
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          if (profile.email === email && profile.name) {
            displayName = profile.name;
          }
        } catch (e) {
          console.error('Failed to parse profile', e);
        }
      }

      login({ uid: 'mock-google-uid', email, displayName });
      navigate('/language');
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#050a1f] justify-center relative overflow-hidden">
      {/* Background Effects */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
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
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050a1f]/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white"
            >
              Login Successful
            </motion.h2>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 relative z-10"
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-panel border border-neon-blue/30 text-neon-blue mb-4 shadow-[0_0_20px_rgba(0,243,255,0.2)]"
        >
          <LogIn className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white tracking-wide neon-text-blue">{t('auth.login')}</h2>
        <p className="text-gray-400 mt-2 tracking-wide">{t('app.title')}</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-4 text-sm relative z-10 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleLogin} className="space-y-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">{t('auth.email')}</label>
          <motion.div 
            className="relative"
            animate={emailError || error ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={email}
              onChange={handleEmailChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border ${emailError || error ? 'border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,243,255,0.2)]'} text-white outline-none transition-all`}
              placeholder="Email or Mobile Number"
            />
          </motion.div>
          {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-400 mb-1 tracking-wider uppercase">{t('auth.password')}</label>
          <motion.div 
            className="relative"
            animate={passwordError || error ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={handlePasswordChange}
              className={`w-full pl-10 pr-12 py-3 rounded-xl bg-black/40 border ${passwordError || error ? 'border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,243,255,0.2)]'} text-white outline-none transition-all`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-blue focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </motion.div>
          {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          <div className="text-right mt-2">
            <button type="button" className="text-sm text-neon-blue hover:text-white transition-colors font-medium">
              {t('auth.forgot')}
            </button>
          </div>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !!emailError || !!passwordError || !email || !password}
          className="w-full bg-neon-blue/10 text-neon-blue py-3 rounded-xl font-bold hover:bg-neon-blue/20 transition-all disabled:opacity-50 border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] tracking-wide mt-4 relative overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            t('auth.login')
          )}
        </motion.button>
      </form>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 relative z-10"
      >
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#050a1f] text-gray-500 uppercase tracking-wider">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-3 glass-panel border border-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {t('auth.google')}
        </button>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-gray-400 relative z-10"
      >
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="text-neon-blue font-bold hover:text-white transition-colors tracking-wide">
          {t('auth.signup')}
        </Link>
      </motion.p>
    </div>
  );
}
