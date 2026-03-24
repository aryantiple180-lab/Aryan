import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import BottomNav from '../components/BottomNav';
import { Pill, Activity, MapPin, ShoppingBag, Lightbulb, MessageSquare, Bell, Settings, X, Dumbbell, Wind, FileText, Stethoscope, Heart, Moon, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Reminder {
  id: string;
  name: string;
  dosage: string;
  time: string; // HH:mm format
  startDate?: string;
  endDate?: string;
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const getGreetingKey = () => {
    const options = { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false } as const;
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const hour = parseInt(formatter.format(new Date()), 10);

    if (hour >= 5 && hour < 12) return 'home.greeting.morning';
    if (hour >= 12 && hour < 17) return 'home.greeting.afternoon';
    if (hour >= 17 && hour < 21) return 'home.greeting.evening';
    return 'home.greeting.night';
  };

  const [greetingKey, setGreetingKey] = useState(getGreetingKey());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosActive, setSosActive] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    ringtone: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
    volume: 1.0
  });
  const [activeAlarm, setActiveAlarm] = useState<{id: string, name: string, dosage: string, time: string, audio: HTMLAudioElement} | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const lastNotifiedMinute = useRef<string>('');
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const storedStreak = localStorage.getItem(`streak_${user.uid}`);
      if (storedStreak) setStreak(parseInt(storedStreak, 10));
      
      const storedBadges = localStorage.getItem(`badges_${user.uid}`);
      if (storedBadges) setBadges(JSON.parse(storedBadges));
    }
  }, [user]);

  const features = [
    { path: '/medicine', icon: Pill, label: 'home.medicine', color: 'text-neon-blue', border: 'neon-border-blue' },
    { path: '/health', icon: Activity, label: 'home.health', color: 'text-neon-green', border: 'neon-border-green' },
    { path: '/hospitals', icon: MapPin, label: 'home.hospitals', color: 'text-neon-purple', border: 'neon-border-purple' },
    { path: '/order', icon: ShoppingBag, label: 'home.order', color: 'text-neon-pink', border: 'border-pink-500/50 shadow-[0_0_10px_rgba(255,0,127,0.5)]' },
    { path: '/chatbot', icon: MessageSquare, label: 'home.chatbot', color: 'text-neon-blue', border: 'neon-border-blue' },
    { path: '/fitness', icon: Dumbbell, label: 'home.fitness', color: 'text-neon-green', border: 'neon-border-green' },
    { path: '/lung-test', icon: Wind, label: 'home.lung', color: 'text-neon-purple', border: 'neon-border-purple' },
    { path: '/therapy-reports', icon: FileText, label: 'home.therapy', color: 'text-neon-blue', border: 'neon-border-blue' },
    { path: '/doctor-booking', icon: Stethoscope, label: 'home.doctor', color: 'text-neon-green', border: 'neon-border-green' },
  ];

  useEffect(() => {
    const updateGreeting = () => {
      setGreetingKey(getGreetingKey());
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`reminders_${user.uid}`);
      if (stored) {
        try {
          setReminders(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse reminders", e);
        }
      }
      const storedSettings = localStorage.getItem(`notification_settings_${user.uid}`);
      if (storedSettings) {
        try {
          setNotificationSettings(JSON.parse(storedSettings));
        } catch (e) {
          console.error("Failed to parse notification settings", e);
        }
      }
      const storedNotif = localStorage.getItem(`notifications_enabled_${user.uid}`);
      if (storedNotif !== null) {
        try {
          setNotificationsEnabled(JSON.parse(storedNotif));
        } catch (e) {
          console.error("Failed to parse notifications enabled", e);
        }
      }
    }
  }, [user]);

  // Find the next upcoming reminder
  const getNextReminder = () => {
    if (reminders.length === 0) return null;
    
    const now = new Date();
    const currentIstTime = now.toLocaleTimeString('en-US', { 
      timeZone: 'Asia/Kolkata', 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Filter reminders that are active today
    const activeReminders = reminders.filter(r => {
      if (r.startDate && r.startDate > todayStr) return false;
      if (r.endDate && r.endDate < todayStr) return false;
      // For weekly, we could check day of week, but let's keep it simple for now or implement if needed
      return true;
    });

    if (activeReminders.length === 0) return null;

    const upcoming = activeReminders.filter(r => r.time >= currentIstTime).sort((a, b) => a.time.localeCompare(b.time));
    if (upcoming.length > 0) return upcoming[0];
    
    // If no upcoming today, return the first one tomorrow
    return [...activeReminders].sort((a, b) => a.time.localeCompare(b.time))[0];
  };

  const nextReminder = getNextReminder();

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const istTimeStr = now.toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Kolkata', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Update countdown
      if (nextReminder) {
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const reminderDate = new Date(istNow);
        const [remHour, remMin] = nextReminder.time.split(':').map(Number);
        reminderDate.setHours(remHour, remMin, 0, 0);
        
        if (reminderDate < istNow) {
          reminderDate.setDate(reminderDate.getDate() + 1);
        }
        
        const diffMs = reminderDate.getTime() - istNow.getTime();
        if (diffMs <= 0) {
          setCountdown('0 minutes 0 seconds');
        } else {
          const diffSecs = Math.floor(diffMs / 1000);
          const hours = Math.floor(diffSecs / 3600);
          const minutes = Math.floor((diffSecs % 3600) / 60);
          const seconds = diffSecs % 60;
          
          let countdownStr = '';
          if (hours > 0) countdownStr += `${hours} hours `;
          countdownStr += `${minutes} minutes ${seconds} seconds`;
          setCountdown(countdownStr);
        }
      } else {
        setCountdown('');
      }

      if (istTimeStr !== lastNotifiedMinute.current) {
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        
        reminders.forEach(reminder => {
          // Check if reminder is active today
          if (reminder.startDate && reminder.startDate > todayStr) return;
          if (reminder.endDate && reminder.endDate < todayStr) return;

          if (reminder.time === istTimeStr) {
            // Play sound
            if (notificationsEnabled) {
              const audio = new Audio(notificationSettings.ringtone);
              audio.volume = notificationSettings.volume;
              audio.loop = true;
              audio.play().catch(e => console.log('Audio play failed', e));

              // Stop audio after 25 seconds automatically
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
                setActiveAlarm(prev => prev?.audio === audio ? null : prev);
              }, 25000);

              // Show notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Medicine Reminder', {
                  body: `Time to take your medicine: ${reminder.name} ${reminder.dosage ? `(${reminder.dosage})` : ''}`,
                  icon: '/vite.svg'
                });
              }
              
              setActiveAlarm({ id: reminder.id, name: reminder.name, dosage: reminder.dosage, time: reminder.time, audio });
            } else {
              // Just show the modal without sound if notifications are disabled
              setActiveAlarm({ id: reminder.id, name: reminder.name, dosage: reminder.dosage, time: reminder.time, audio: new Audio() });
            }
          }
        });
        lastNotifiedMinute.current = istTimeStr;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reminders, notificationSettings, nextReminder, notificationsEnabled]);





  const formatTime12Hour = (time24: string) => {
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
  };

  const stopAlarm = () => {
    if (activeAlarm?.audio) {
      activeAlarm.audio.pause();
      activeAlarm.audio.currentTime = 0;
    }
    setActiveAlarm(null);
  };

  const handleTakeMedicine = () => {
    stopAlarm();
    if (user && activeAlarm) {
      const historyKey = `reminder_history_${user.uid}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.push({
        id: activeAlarm.id,
        name: activeAlarm.name,
        dosage: activeAlarm.dosage,
        time: activeAlarm.time,
        takenAt: new Date().toISOString()
      });
      localStorage.setItem(historyKey, JSON.stringify(history));

      // Update streak
      const today = new Date().toLocaleDateString();
      const lastMedicineDate = localStorage.getItem(`last_medicine_date_${user.uid}`);
      
      if (lastMedicineDate !== today) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem(`streak_${user.uid}`, newStreak.toString());
        localStorage.setItem(`last_medicine_date_${user.uid}`, today);

        // Check for badges
        if (newStreak === 7 && !badges.includes('7-Day Streak')) {
          const newBadges = [...badges, '7-Day Streak'];
          setBadges(newBadges);
          localStorage.setItem(`badges_${user.uid}`, JSON.stringify(newBadges));
        }
      }
    }
  };

  const handleSnooze = () => {
    stopAlarm();
    if (user && activeAlarm) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const snoozeTime = now.toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Kolkata', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const newReminders = [...reminders, {
        id: `snooze_${Date.now()}`,
        name: activeAlarm.name,
        dosage: activeAlarm.dosage,
        time: snoozeTime,
        startDate: now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
        endDate: now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      }];
      setReminders(newReminders);
      localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(newReminders));
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSOSModal && !sosActive && sosCountdown > 0) {
      timer = setTimeout(() => setSosCountdown(c => c - 1), 1000);
    } else if (showSOSModal && !sosActive && sosCountdown === 0) {
      setSosActive(true);
      // Trigger actual SOS actions here
      console.log("SOS TRIGGERED: Calling emergency contacts, sharing location...");
      // In a real app, this would use native APIs to make calls and send SMS
    }
    return () => clearTimeout(timer);
  }, [showSOSModal, sosCountdown, sosActive]);

  const cancelSOS = () => {
    setShowSOSModal(false);
    setSosCountdown(5);
    setSosActive(false);
  };

  const triggerSOS = () => {
    setShowSOSModal(true);
    setSosCountdown(5);
    setSosActive(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Active Alarm Modal */}
      {activeAlarm && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-panel rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.3)] animate-bounce-slight text-center p-8 border border-neon-blue/50">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-2 border-neon-blue animate-ping opacity-50"></div>
              <div className="absolute inset-2 rounded-full border-2 border-neon-purple animate-spin-slow opacity-70"></div>
              <Bell className="w-10 h-10 text-neon-blue animate-pulse relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 neon-text-blue">Time for Medicine!</h2>
            <p className="text-xl font-semibold text-neon-green mb-1">{activeAlarm.name}</p>
            {activeAlarm.dosage && <p className="text-gray-400 mb-2">{activeAlarm.dosage}</p>}
            <p className="text-neon-blue font-bold mb-8">{formatTime12Hour(activeAlarm.time)}</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleTakeMedicine}
                className="w-full bg-neon-green text-[#050a1f] py-4 rounded-2xl font-bold text-lg hover:bg-neon-green/90 transition-colors shadow-[0_0_15px_rgba(57,255,20,0.4)]"
              >
                Take Medicine
              </button>
              <button 
                onClick={handleSnooze}
                className="w-full bg-neon-blue/20 border border-neon-blue text-neon-blue py-3 rounded-2xl font-bold text-lg hover:bg-neon-blue/30 transition-colors"
              >
                Snooze (5 mins)
              </button>
              <button 
                onClick={stopAlarm}
                className="w-full bg-transparent border border-gray-500 text-gray-400 py-3 rounded-2xl font-bold text-lg hover:bg-white/5 transition-colors"
              >
                Stop / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="p-6 pb-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-neon-blue text-sm font-medium tracking-wider uppercase">{t(greetingKey)}</p>
            <h1 className="text-2xl font-bold text-white tracking-wide">{user?.displayName || 'User'}</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={triggerSOS}
              className="w-10 h-10 bg-red-500/10 border border-red-500/50 rounded-full flex items-center justify-center relative hover:bg-red-500/20 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            >
              <span className="text-xs font-bold text-red-500 tracking-wider">SOS</span>
            </button>
            <button 
              onClick={() => setShowNotificationSettings(true)}
              className="w-10 h-10 glass-panel rounded-full flex items-center justify-center relative hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_8px_rgba(255,0,127,0.8)]"></span>
            </button>
            <Link 
              to="/settings"
              className="w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-300" />
            </Link>
          </div>
        </div>
        
        {/* Medicine Reminder Widget */}
        {nextReminder && (
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 border-l-4 border-l-neon-blue mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neon-blue/10 rounded-xl flex items-center justify-center border border-neon-blue/30">
                  <Pill className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Next Medicine</p>
                  <p className="text-lg font-bold text-white">{nextReminder.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Time</p>
                <p className="text-lg font-bold text-neon-blue">{formatTime12Hour(nextReminder.time)}</p>
              </div>
            </div>
            {countdown && (
              <div className="bg-black/40 rounded-lg p-2 text-center border border-white/5">
                <p className="text-sm font-medium text-neon-green tracking-wide">In: {countdown}</p>
              </div>
            )}
          </div>
        )}

        {/* Gamification Widget */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/30">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Daily Streak</p>
              <p className="text-lg font-bold text-white tracking-wide">{streak} Days 🔥</p>
            </div>
          </div>
          <div className="flex gap-2">
            {badges.length > 0 ? badges.map((badge, idx) => (
              <div key={idx} className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center" title={badge}>
                <span className="text-sm">🏆</span>
              </div>
            )) : (
              <div className="text-xs text-gray-500 italic">No badges yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-2 z-10 pb-24">
        
        {/* 3D Dashboard Area */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050a1f] z-10 pointer-events-none"></div>
          <div className="h-64 glass-panel rounded-3xl flex items-center justify-center relative overflow-hidden border border-neon-blue/20">
            {/* Grid Background */}
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* 3D Body Placeholder */}
            <motion.div 
              animate={{ rotateY: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative z-20 w-32 h-48 flex items-center justify-center"
            >
              <div className="w-full h-full bg-neon-blue/10 rounded-full blur-xl absolute"></div>
              <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]">
                <path d="M50 10 C60 10, 65 20, 65 30 C65 40, 55 45, 50 45 C45 45, 35 40, 35 30 C35 20, 40 10, 50 10 Z" fill="rgba(0,243,255,0.2)" stroke="#00f3ff" strokeWidth="1"/>
                <path d="M35 45 L65 45 L80 100 L70 100 L60 70 L40 70 L30 100 L20 100 Z" fill="rgba(0,243,255,0.1)" stroke="#00f3ff" strokeWidth="1"/>
                <path d="M40 70 L60 70 L65 130 L55 130 L50 100 L45 130 L35 130 Z" fill="rgba(0,243,255,0.1)" stroke="#00f3ff" strokeWidth="1"/>
                <path d="M35 130 L45 130 L45 190 L30 190 Z" fill="rgba(0,243,255,0.1)" stroke="#00f3ff" strokeWidth="1"/>
                <path d="M55 130 L65 130 L70 190 L55 190 Z" fill="rgba(0,243,255,0.1)" stroke="#00f3ff" strokeWidth="1"/>
              </svg>
              
              {/* Glowing Nodes */}
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-[30%] left-[45%] w-3 h-3 bg-neon-pink rounded-full shadow-[0_0_10px_#ff007f]"></motion.div>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute top-[45%] left-[30%] w-2 h-2 bg-neon-green rounded-full shadow-[0_0_10px_#00ff66]"></motion.div>
            </motion.div>

            {/* Floating Stats */}
            <div className="absolute top-4 left-4 glass-panel px-3 py-1 rounded-full border border-neon-green/30 flex items-center gap-2">
              <Activity className="w-3 h-3 text-neon-green" />
              <span className="text-xs font-mono text-white">98% O2</span>
            </div>
            <div className="absolute bottom-4 right-4 glass-panel px-3 py-1 rounded-full border border-neon-pink/30 flex items-center gap-2">
              <Heart className="w-3 h-3 text-neon-pink" />
              <span className="text-xs font-mono text-white">72 BPM</span>
            </div>
          </div>
        </div>

        {/* Animated Health Graphs */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-panel p-4 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-neon-pink" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Heart Rate</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">72 <span className="text-sm text-gray-500 font-normal">bpm</span></div>
            <div className="h-10 flex items-end gap-1">
              {[40, 60, 45, 80, 50, 70, 45, 65].map((h, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [`${h}%`, `${h + (Math.random() * 20 - 10)}%`, `${h}%`] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="flex-1 bg-neon-pink/50 rounded-t-sm"
                ></motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-neon-orange" style={{ color: '#ff8c00' }} />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Calories</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">1,240 <span className="text-sm text-gray-500 font-normal">kcal</span></div>
            <div className="relative h-10 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff8c00] to-neon-pink"
              ></motion.div>
            </div>
          </div>
        </div>

        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">System Modules</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Link
                key={idx}
                to={feature.path}
                className={`glass-panel p-4 rounded-2xl border ${feature.border} hover:bg-white/10 transition-all flex flex-col items-center justify-center text-center gap-3 active:scale-95 group relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/40 border border-white/10 shadow-inner`}>
                  <Icon className={`w-6 h-6 ${feature.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="font-medium text-gray-300 text-sm leading-tight tracking-wide">{t(feature.label)}</span>
              </Link>
            );
          })}
        </div>
      </div>



      {/* SOS Modal */}
      <AnimatePresence>
        {showSOSModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/90 z-[100] flex items-center justify-center p-4 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.5)] border border-red-500/50 p-8 text-center relative"
            >
              {!sosActive ? (
                <>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-50"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-red-500 animate-spin-slow opacity-70"></div>
                    <span className="text-4xl font-bold text-red-500 relative z-10">{sosCountdown}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Emergency SOS</h2>
                  <p className="text-red-400 mb-8 text-sm">Auto-calling emergency contacts and sharing live location in {sosCountdown} seconds...</p>
                  
                  <button 
                    onClick={cancelSOS}
                    className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel SOS
                  </button>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-red-500">
                    <MapPin className="w-10 h-10 text-red-500 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-500 mb-2 tracking-wide">SOS Active</h2>
                  <p className="text-white mb-6 text-sm">Emergency contacts notified. Live location shared.</p>
                  
                  <div className="bg-white/5 rounded-xl p-4 mb-8 text-left border border-white/10">
                    <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Nearest Hospitals</h3>
                    <ul className="space-y-2">
                      <li className="text-sm text-neon-blue flex items-center gap-2"><MapPin className="w-4 h-4" /> City General Hospital (1.2km)</li>
                      <li className="text-sm text-neon-blue flex items-center gap-2"><MapPin className="w-4 h-4" /> Metro Care Center (3.5km)</li>
                    </ul>
                  </div>

                  <button 
                    onClick={cancelSOS}
                    className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    End Emergency
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-panel rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.2)] border border-neon-blue/30">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold text-white tracking-wide">System Settings</h2>
              <button onClick={() => setShowNotificationSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Alert Protocol</label>
                <select 
                  value={notificationSettings.ringtone.startsWith('blob:') ? 'custom' : notificationSettings.ringtone}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      document.getElementById('custom-ringtone-upload')?.click();
                    } else {
                      const newSettings = { ...notificationSettings, ringtone: e.target.value };
                      setNotificationSettings(newSettings);
                      if (user) localStorage.setItem(`notification_settings_${user.uid}`, JSON.stringify(newSettings));
                    }
                  }}
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-white"
                >
                  <option value="https://actions.google.com/sounds/v1/alarms/beep_short.ogg">System Beep</option>
                  <option value="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg">Digital Chime</option>
                  <option value="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg">Standard Alert</option>
                  <option value="https://actions.google.com/sounds/v1/alarms/dosimeter_alarm.ogg">Gentle Pulse</option>
                  <option value="custom">Upload Protocol...</option>
                </select>
                {notificationSettings.ringtone.startsWith('blob:') && (
                  <p className="text-xs text-neon-green mt-2 font-medium">Custom protocol loaded</p>
                )}
                <input 
                  type="file" 
                  id="custom-ringtone-upload" 
                  accept="audio/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      const newSettings = { ...notificationSettings, ringtone: url };
                      setNotificationSettings(newSettings);
                      if (user) localStorage.setItem(`notification_settings_${user.uid}`, JSON.stringify(newSettings));
                    }
                  }}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Output Level: {Math.round(notificationSettings.volume * 100)}%</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={notificationSettings.volume}
                  onChange={(e) => {
                    const newSettings = { ...notificationSettings, volume: parseFloat(e.target.value) };
                    setNotificationSettings(newSettings);
                    if (user) localStorage.setItem(`notification_settings_${user.uid}`, JSON.stringify(newSettings));
                  }}
                  className="w-full accent-neon-blue"
                />
              </div>

              <button 
                onClick={() => {
                  const audio = new Audio(notificationSettings.ringtone);
                  audio.volume = notificationSettings.volume;
                  audio.play().catch(e => console.log('Preview failed', e));
                }}
                className="w-full bg-neon-blue/10 border border-neon-blue text-neon-blue font-bold py-3 rounded-xl hover:bg-neon-blue/20 transition-colors shadow-[0_0_10px_rgba(0,243,255,0.2)]"
              >
                Test Protocol
              </button>
            </div>
          </div>
        </div>
      )}



      <BottomNav />
    </div>
  );
}
