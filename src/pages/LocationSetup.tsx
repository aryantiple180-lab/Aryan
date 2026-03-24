import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Navigation } from 'lucide-react';

export default function LocationSetup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAllowLocation = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem('user_lat', position.coords.latitude.toString());
          localStorage.setItem('user_lng', position.coords.longitude.toString());
          setLoading(false);
          navigate('/');
        },
        (error) => {
          console.error('Error getting location', error);
          setLoading(false);
          // Fallback or show error
          alert('Could not get location. Please enter manually.');
        }
      );
    } else {
      setLoading(false);
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleManualLocation = () => {
    // In a real app, this would open a search modal or input
    const zip = prompt('Enter your ZIP code or City:');
    if (zip) {
      localStorage.setItem('user_location_manual', zip);
      navigate('/');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#050a1f] justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full glass-panel border border-neon-blue/30 text-neon-blue mb-6 relative shadow-[0_0_20px_rgba(0,243,255,0.2)]">
          <MapPin className="w-12 h-12 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
          <div className="absolute top-0 right-0 w-6 h-6 bg-neon-green rounded-full border-4 border-[#050a1f] shadow-[0_0_10px_rgba(0,255,102,0.8)]"></div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-wide neon-text-blue">{t('loc.allow')}</h2>
        <p className="text-gray-400 max-w-xs mx-auto leading-relaxed tracking-wide">
          {t('loc.desc')}
        </p>
      </div>

      <div className="space-y-4 w-full max-w-sm mx-auto relative z-10">
        <button
          onClick={handleAllowLocation}
          disabled={loading}
          className="w-full bg-neon-blue/10 text-neon-blue py-4 rounded-xl font-bold hover:bg-neon-blue/20 transition-all flex items-center justify-center gap-2 border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] tracking-wide disabled:opacity-50"
        >
          <Navigation className="w-5 h-5" />
          {loading ? '...' : t('loc.allow')}
        </button>

        <button
          onClick={handleManualLocation}
          className="w-full bg-black/40 border border-white/10 text-white py-4 rounded-xl font-bold hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all tracking-wide"
        >
          {t('loc.manual')}
        </button>
      </div>
      
      <button 
        onClick={() => navigate('/')}
        className="mt-8 text-gray-500 hover:text-white text-sm font-medium tracking-wider uppercase transition-colors relative z-10"
      >
        Skip for now
      </button>
    </div>
  );
}
