import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Globe2 } from 'lucide-react';

export default function LanguageSelect() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelect = async (lang: 'en' | 'hi' | 'mr') => {
    setLanguage(lang);
    if (user) {
      const storedProfile = localStorage.getItem('user_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        profile.language = lang;
        localStorage.setItem('user_profile', JSON.stringify(profile));
      }
    }
    navigate('/location');
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#050a1f] justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-panel border border-neon-blue/30 text-neon-blue mb-6 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
          <Globe2 className="w-10 h-10 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 tracking-wide neon-text-blue">{t('lang.select')}</h2>
        <p className="text-gray-400 tracking-wide">Choose your preferred language</p>
      </div>

      <div className="space-y-4 relative z-10">
        <button
          onClick={() => handleSelect('en')}
          className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
            language === 'en' ? 'border-neon-green bg-neon-green/10 shadow-[0_0_15px_rgba(0,255,102,0.2)]' : 'border-white/10 bg-black/40 hover:border-neon-green/50 hover:bg-neon-green/5'
          }`}
        >
          <span className={`text-lg font-bold tracking-wide ${language === 'en' ? 'text-neon-green' : 'text-white'}`}>English</span>
          <span className="text-sm text-gray-500 uppercase tracking-wider">English</span>
        </button>

        <button
          onClick={() => handleSelect('hi')}
          className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
            language === 'hi' ? 'border-neon-green bg-neon-green/10 shadow-[0_0_15px_rgba(0,255,102,0.2)]' : 'border-white/10 bg-black/40 hover:border-neon-green/50 hover:bg-neon-green/5'
          }`}
        >
          <span className={`text-lg font-bold tracking-wide ${language === 'hi' ? 'text-neon-green' : 'text-white'}`}>हिंदी</span>
          <span className="text-sm text-gray-500 uppercase tracking-wider">Hindi</span>
        </button>

        <button
          onClick={() => handleSelect('mr')}
          className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
            language === 'mr' ? 'border-neon-green bg-neon-green/10 shadow-[0_0_15px_rgba(0,255,102,0.2)]' : 'border-white/10 bg-black/40 hover:border-neon-green/50 hover:bg-neon-green/5'
          }`}
        >
          <span className={`text-lg font-bold tracking-wide ${language === 'mr' ? 'text-neon-green' : 'text-white'}`}>मराठी</span>
          <span className="text-sm text-gray-500 uppercase tracking-wider">Marathi</span>
        </button>
      </div>
    </div>
  );
}
