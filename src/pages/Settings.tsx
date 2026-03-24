import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import BottomNav from '../components/BottomNav';
import { 
  ArrowLeft, 
  History, 
  Bell, 
  Globe, 
  Phone, 
  Shield, 
  HelpCircle, 
  Info, 
  Star,
  ChevronRight,
  LogOut,
  Send,
  Users,
  UserPlus,
  Link
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reminders, setReminders] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<{name: string, phone: string}[]>([]);
  const [newContact, setNewContact] = useState({name: '', phone: ''});
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);
  const [caregiverInvite, setCaregiverInvite] = useState({ type: 'email', value: '' });
  const [chatMessages, setChatMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: "Hello! I'm your AI health assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      const storedReminders = localStorage.getItem(`reminders_${user.uid}`);
      if (storedReminders) setReminders(JSON.parse(storedReminders));

      const storedContacts = localStorage.getItem(`emergency_contacts_${user.uid}`);
      if (storedContacts) setEmergencyContacts(JSON.parse(storedContacts));
      
      const storedNotif = localStorage.getItem(`notifications_enabled_${user.uid}`);
      if (storedNotif !== null) setNotificationsEnabled(JSON.parse(storedNotif));
    }
  }, [user]);

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      const updated = [...emergencyContacts, newContact];
      setEmergencyContacts(updated);
      if (user) localStorage.setItem(`emergency_contacts_${user.uid}`, JSON.stringify(updated));
      setNewContact({name: '', phone: ''});
      setShowAddContact(false);
    }
  };

  const handleRemoveContact = (index: number) => {
    const updated = emergencyContacts.filter((_, i) => i !== index);
    setEmergencyContacts(updated);
    if (user) localStorage.setItem(`emergency_contacts_${user.uid}`, JSON.stringify(updated));
  };

  const handleAddCaregiver = () => {
    if (caregiverInvite.value) {
      alert(`Invitation sent to ${caregiverInvite.value}!`);
      setShowAddCaregiver(false);
      setCaregiverInvite({ type: 'email', value: '' });
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMessages = [...chatMessages, { role: 'user' as const, text: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        text: "I'm a simulated AI assistant. In a real app, I would connect to a backend service to provide health guidance based on your query." 
      }]);
    }, 1000);
  };

  const handleToggleNotifications = () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    if (user) localStorage.setItem(`notifications_enabled_${user.uid}`, JSON.stringify(newVal));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'history':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide neon-text-blue">Medical Reminder History</h3>
            <div className="space-y-4">
              {reminders.length === 0 ? (
                <div className="glass-panel rounded-2xl p-6 text-center border border-white/5">
                  <p className="text-gray-400 text-sm">No history available yet.</p>
                </div>
              ) : (
                reminders.map(reminder => {
                  const now = new Date();
                  const currentIstTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });
                  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                  
                  let isUpcoming = false;
                  if (reminder.endDate && reminder.endDate < todayStr) {
                    isUpcoming = false;
                  } else if (reminder.startDate && reminder.startDate > todayStr) {
                    isUpcoming = true;
                  } else {
                    isUpcoming = reminder.time > currentIstTime;
                  }

                  return (
                    <div key={reminder.id} className="glass-panel rounded-2xl p-5 border border-white/10 flex justify-between items-center hover:border-neon-blue/30 transition-colors">
                      <div>
                        <p className="font-bold text-white tracking-wide">{reminder.name}</p>
                        <p className="text-sm text-gray-400 mt-1">{reminder.dosage} • <span className="text-neon-blue">{reminder.time}</span></p>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase border ${isUpcoming ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                        {isUpcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide neon-text-orange">Notification Settings</h3>
            <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium tracking-wide">Enable Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={handleToggleNotifications} />
                  <div className="w-11 h-6 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-orange border border-white/10 peer-checked:shadow-[0_0_10px_rgba(255,140,0,0.5)]"></div>
                </label>
              </div>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide neon-text-green">Language Settings</h3>
            <div className="glass-panel rounded-2xl p-3 border border-white/10">
              {['en', 'hi', 'mr'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang as any);
                    setTimeout(() => window.location.reload(), 100);
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl mb-2 flex items-center justify-between transition-colors ${
                    language === lang ? 'bg-neon-green/10 text-neon-green font-bold border border-neon-green/30 shadow-[0_0_10px_rgba(57,255,20,0.1)]' : 'text-gray-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                  {language === lang && <div className="w-2.5 h-2.5 rounded-full bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.8)]" />}
                </button>
              ))}
            </div>
          </div>
        );
      case 'emergency':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide neon-text-pink">Emergency Contacts</h3>
            <div className="space-y-4 mb-6">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className="glass-panel rounded-2xl p-5 border border-white/10 flex justify-between items-center hover:border-neon-pink/30 transition-colors">
                  <div>
                    <p className="font-bold text-white tracking-wide">{contact.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{contact.phone}</p>
                  </div>
                  <div className="flex gap-3">
                    <a href={`tel:${contact.phone}`} className="w-10 h-10 flex items-center justify-center bg-neon-green/10 text-neon-green rounded-full hover:bg-neon-green/20 border border-neon-green/30 transition-colors shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                      <Phone className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleRemoveContact(idx)} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 border border-red-500/30 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {showAddContact ? (
              <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                <input type="text" placeholder="Contact Name" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-pink text-white transition-colors placeholder-gray-500" />
                <input type="tel" placeholder="Phone Number" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-pink text-white transition-colors placeholder-gray-500" />
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddContact(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl border border-white/10 transition-colors">Cancel</button>
                  <button onClick={handleAddContact} className="flex-1 py-3 bg-neon-pink/20 text-neon-pink font-bold rounded-xl hover:bg-neon-pink/30 border border-neon-pink shadow-[0_0_15px_rgba(255,20,147,0.3)] transition-colors">Save</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddContact(true)} className="w-full py-4 border-2 border-dashed border-neon-pink/30 text-neon-pink rounded-2xl font-bold hover:bg-neon-pink/10 transition-colors tracking-wide">
                + Add Emergency Contact
              </button>
            )}
            
            {emergencyContacts.length > 0 && (
              <button onClick={() => alert('SOS Alert sent to all emergency contacts and linked caregivers!\n\n"Emergency Alert! User has triggered an SOS alert. Current Location: [Map Link]"')} className="w-full mt-8 py-4 bg-red-600 text-white rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:bg-red-700 transition-colors flex items-center justify-center gap-2 tracking-widest uppercase border border-red-500">
                <Phone className="w-5 h-5" />
                ACTIVATE SOS
              </button>
            )}
          </div>
        );
      case 'privacy':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide neon-text-purple">Privacy & Security</h3>
            <div className="glass-panel rounded-2xl p-2 border border-white/10">
              <button className="w-full text-left px-4 py-4 text-white font-medium border-b border-white/5 hover:bg-white/5 transition-colors rounded-t-xl">Change Password</button>
              <button className="w-full text-left px-4 py-4 text-white font-medium border-b border-white/5 hover:bg-white/5 transition-colors">Privacy Controls</button>
              <button className="w-full text-left px-4 py-4 text-red-500 font-bold hover:bg-red-500/10 transition-colors rounded-b-xl">Delete Account</button>
            </div>
          </div>
        );
      case 'caregiver':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide neon-text-green">Caregiver Mode</h3>
            <p className="text-sm text-gray-400 mb-6">Connect with family members or doctors to allow them to monitor your health and manage reminders.</p>
            
            <div className="space-y-4 mb-8">
              <button onClick={() => navigate('/caregiver-dashboard')} className="w-full glass-panel rounded-2xl p-5 border border-neon-green/30 hover:bg-neon-green/10 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center border border-neon-green/50 shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                    <Users className="w-6 h-6 text-neon-green" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white tracking-wide">Caregiver Dashboard</p>
                    <p className="text-xs text-gray-400 mt-1">View as Caregiver</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neon-green group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <h4 className="font-bold text-white mb-4 tracking-wide">Linked Caregivers</h4>
            <div className="space-y-4 mb-6">
              <div className="glass-panel rounded-2xl p-5 border border-white/10 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white tracking-wide">Priya (Daughter)</p>
                  <p className="text-xs text-neon-green mt-1">Active • Full Access</p>
                </div>
                <button className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors">Remove</button>
              </div>
            </div>

            {showAddCaregiver ? (
              <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                <h4 className="font-bold text-white text-sm">Invite Caregiver</h4>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setCaregiverInvite({ ...caregiverInvite, type: 'email' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${caregiverInvite.type === 'email' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'bg-white/5 text-gray-400 border border-transparent'}`}>Email</button>
                  <button onClick={() => setCaregiverInvite({ ...caregiverInvite, type: 'phone' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${caregiverInvite.type === 'phone' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'bg-white/5 text-gray-400 border border-transparent'}`}>Phone</button>
                </div>
                <input 
                  type={caregiverInvite.type === 'email' ? 'email' : 'tel'} 
                  placeholder={caregiverInvite.type === 'email' ? 'Enter email address' : 'Enter phone number'} 
                  value={caregiverInvite.value} 
                  onChange={e => setCaregiverInvite({...caregiverInvite, value: e.target.value})} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-green text-white transition-colors placeholder-gray-500" 
                />
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddCaregiver(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl border border-white/10 transition-colors">Cancel</button>
                  <button onClick={handleAddCaregiver} className="flex-1 py-3 bg-neon-green/20 text-neon-green font-bold rounded-xl hover:bg-neon-green/30 border border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-colors">Send Invite</button>
                </div>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>
                <button onClick={() => {
                  navigator.clipboard.writeText('https://healthcare.app/invite/12345');
                  alert('Invite link copied to clipboard!');
                }} className="w-full py-3 text-sm font-bold rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  <Link className="w-4 h-4" /> Copy Invite Link
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAddCaregiver(true)} className="w-full py-4 border-2 border-dashed border-neon-green/30 text-neon-green rounded-2xl font-bold hover:bg-neon-green/10 transition-colors tracking-wide flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Caregiver
              </button>
            )}

            <div className="mt-8 glass-panel rounded-2xl p-5 border border-white/10">
              <h4 className="font-bold text-white mb-3 text-sm">Permissions</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Allow health data viewing</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-green border border-white/10"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Allow report viewing</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-green border border-white/10"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Allow reminder editing</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-green border border-white/10"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Allow location access</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-green border border-white/10"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide neon-text-blue">AI Help & Support</h3>
            <div className="flex-1 glass-panel rounded-3xl p-4 border border-white/10 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed tracking-wide ${msg.role === 'user' ? 'bg-neon-blue/20 text-white rounded-br-sm border border-neon-blue/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'bg-black/40 text-gray-200 rounded-bl-sm border border-white/10'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 bg-black/40 p-2 rounded-full border border-white/10">
                <input 
                  type="text" 
                  placeholder="Ask a question..." 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-white placeholder-gray-500" 
                />
                <button onClick={handleSendChat} className="w-10 h-10 bg-neon-blue/20 text-neon-blue rounded-full flex items-center justify-center hover:bg-neon-blue/30 transition-colors border border-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)] shrink-0">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-white tracking-wide">About Application</h3>
            <div className="glass-panel rounded-3xl p-8 border border-white/10 text-center relative overflow-hidden">
              <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-neon-blue/20 rounded-full blur-[50px] pointer-events-none"></div>
              <div className="w-24 h-24 bg-neon-blue/10 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-neon-blue/30 shadow-[0_0_20px_rgba(0,243,255,0.2)] transform rotate-3">
                <span className="text-4xl transform -rotate-3">🏥</span>
              </div>
              <h4 className="text-2xl font-bold text-white tracking-wide neon-text-blue mb-1">HealthCare OS</h4>
              <p className="text-neon-green text-sm font-bold tracking-widest uppercase mb-6">Version 2.0.0</p>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                A next-generation healthcare application designed to help you manage medical reminders, track health metrics, and access AI-powered assistance.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (activeTab) {
    return (
      <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex items-center gap-4">
          <button onClick={() => setActiveTab(null)} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white capitalize tracking-wide">
            {activeTab.replace('-', ' ')}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-24 relative z-10">
          {renderContent()}
        </div>
        <div className="relative z-20">
          <BottomNav />
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'history', icon: History, label: 'settings.history', color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
    { id: 'notifications', icon: Bell, label: 'settings.notifications', color: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30' },
    { id: 'language', icon: Globe, label: 'settings.language', color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
    { id: 'emergency', icon: Phone, label: 'settings.emergency', color: 'text-neon-pink', bg: 'bg-neon-pink/10', border: 'border-neon-pink/30' },
    { id: 'privacy', icon: Shield, label: 'settings.privacy', color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/30' },
    { id: 'caregiver', icon: Users, label: 'settings.caregiver', color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
    { id: 'help', icon: HelpCircle, label: 'settings.help', color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
    { id: 'about', icon: Info, label: 'settings.about', color: 'text-gray-400', bg: 'bg-white/10', border: 'border-white/20' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white tracking-wide neon-text-blue">{t('settings.title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 relative z-10">
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden mb-8 shadow-lg">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group ${
                index !== menuItems.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} border ${item.border} group-hover:scale-105 transition-transform`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="font-bold text-white tracking-wide">{t(item.label)}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-8 text-center mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-neon-orange/5 to-transparent pointer-events-none"></div>
          <h3 className="font-bold text-white text-xl mb-2 tracking-wide neon-text-orange">Rate Our App</h3>
          <p className="text-sm text-gray-400 mb-6">Enjoying the app? Please rate us with 5 stars to support us.</p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRating(star);
                  setTimeout(() => {
                    alert('Thank you for rating! Redirecting to App Store...');
                    window.open('https://play.google.com/store/apps', '_blank');
                  }, 500);
                }}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating ? 'fill-[#ff8c00] text-[#ff8c00] drop-shadow-[0_0_10px_rgba(255,140,0,0.8)]' : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full glass-panel border border-red-500/50 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)] tracking-wide uppercase"
        >
          <LogOut className="w-5 h-5" />
          {t('settings.logout')}
        </button>
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  );
}

