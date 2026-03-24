import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, Pill, MessageSquare, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { t } = useLanguage();

  const navItems = [
    { path: '/', icon: Home, label: 'nav.home' },
    { path: '/health', icon: Activity, label: 'nav.health' },
    { path: '/medicine', icon: Pill, label: 'nav.meds' },
    { path: '/chatbot', icon: MessageSquare, label: 'nav.chat' },
    { path: '/profile', icon: User, label: 'nav.profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = path === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                isActive ? 'text-neon-blue' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-neon-blue rounded-b-full shadow-[0_0_10px_rgba(0,243,255,0.8)]"></div>
              )}
              <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : ''}`} />
              <span className="text-[10px] font-medium tracking-wider">{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
