import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import { User, Mail, Phone, HeartPulse, AlertCircle, PhoneCall, LogOut, Edit2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  useEffect(() => {
    if (!user) return;
    const storedProfile = localStorage.getItem('user_profile');
    if (storedProfile) {
      const data = JSON.parse(storedProfile);
      setProfile(data);
      setFormData(data);
    } else {
      const defaultProfile = {
        name: user.displayName || 'User',
        email: user.email || '',
        mobile: '',
      };
      setProfile(defaultProfile);
      setFormData(defaultProfile);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    localStorage.setItem('user_profile', JSON.stringify(formData));
    setProfile(formData);
    
    // Sync name with the central user identity
    if (formData.name !== user.displayName) {
      updateUser({ ...user, displayName: formData.name });
    }
    
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!profile) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-24 z-10 relative">
        <div className="flex justify-between items-center text-white mb-6">
          <h1 className="text-3xl font-bold tracking-tight neon-text-blue">Profile</h1>
          <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full font-medium hover:bg-white/10 transition-colors border border-neon-blue/30 text-neon-blue">
            {isEditing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 -mt-16 z-20">
        <div className="glass-panel rounded-3xl p-6 shadow-md border border-white/10 mb-6 relative">
          <div className="w-24 h-24 bg-black/40 text-neon-blue rounded-full flex items-center justify-center absolute -top-12 left-1/2 -translate-x-1/2 border border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
            <User className="w-12 h-12" />
          </div>
          
          <div className="mt-12 text-center mb-6">
            {isEditing ? (
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="text-xl font-bold text-center border-b-2 border-neon-blue bg-transparent text-white outline-none w-full max-w-[200px]" />
            ) : (
              <h2 className="text-2xl font-bold text-white tracking-wide">{profile.name}</h2>
            )}
            <p className="text-gray-400">{user?.email}</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neon-blue/10 text-neon-blue rounded-full flex items-center justify-center shrink-0 border border-neon-blue/30">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                <p className="font-medium text-white">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neon-green/10 text-neon-green rounded-full flex items-center justify-center shrink-0 border border-neon-green/30">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mobile</p>
                {isEditing ? (
                  <input type="text" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border-b border-neon-green bg-transparent text-white outline-none py-1" />
                ) : (
                  <p className="font-medium text-white">{profile.mobile || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neon-pink/10 text-neon-pink rounded-full flex items-center justify-center shrink-0 border border-neon-pink/30">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Medical Conditions</p>
                {isEditing ? (
                  <input type="text" value={formData.medicalConditions?.join(', ') || ''} onChange={e => setFormData({...formData, medicalConditions: e.target.value.split(',').map((s: string) => s.trim())})} className="w-full border-b border-neon-pink bg-transparent text-white outline-none py-1" placeholder="Comma separated" />
                ) : (
                  <p className="font-medium text-white">{profile.medicalConditions?.join(', ') || 'None'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neon-orange/10 text-neon-orange rounded-full flex items-center justify-center shrink-0 border border-neon-orange/30" style={{ color: '#ff8c00', borderColor: 'rgba(255, 140, 0, 0.3)', backgroundColor: 'rgba(255, 140, 0, 0.1)' }}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Allergies</p>
                {isEditing ? (
                  <input type="text" value={formData.allergies?.join(', ') || ''} onChange={e => setFormData({...formData, allergies: e.target.value.split(',').map((s: string) => s.trim())})} className="w-full border-b border-[#ff8c00] bg-transparent text-white outline-none py-1" placeholder="Comma separated" />
                ) : (
                  <p className="font-medium text-white">{profile.allergies?.join(', ') || 'None'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shrink-0 border border-red-500/30">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Emergency Contact</p>
                {isEditing ? (
                  <input type="text" value={formData.emergencyContact || ''} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} className="w-full border-b border-red-500 bg-transparent text-white outline-none py-1" />
                ) : (
                  <p className="font-medium text-white">{profile.emergencyContact || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full glass-panel border border-red-500/50 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  );
}
