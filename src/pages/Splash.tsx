import React from 'react';
import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Splash() {
  const { t } = useLanguage();
  return (
    <div className="flex-1 bg-[#050a1f] flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center z-10"
      >
        <div className="glass-panel p-6 rounded-full shadow-[0_0_30px_rgba(0,243,255,0.3)] mb-8 border border-neon-blue/30 relative">
          <div className="absolute inset-0 rounded-full border-2 border-neon-blue animate-ping opacity-50"></div>
          <HeartPulse className="w-16 h-16 text-neon-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
        </div>
        <h1 className="text-4xl font-black mb-3 text-center tracking-wider neon-text-blue">{t('app.title')}</h1>
        <p className="text-gray-400 text-lg text-center tracking-wide">{t('app.tagline')}</p>
      </motion.div>
      
      {/* Background decoration */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl -z-0 pointer-events-none"
      />
    </div>
  );
}
