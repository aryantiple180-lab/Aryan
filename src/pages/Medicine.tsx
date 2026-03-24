import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import { Pill, Plus, Calendar, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Medicine() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ 
    name: '', dosage: '', time: '', frequency: 'daily', startDate: '', endDate: '',
    category: 'General', usage: '', sideEffects: '', missedDose: ''
  });
  const { user } = useAuth();
  const [adherence, setAdherence] = useState(0);

  useEffect(() => {
    if (!user) return;
    const storedMeds = localStorage.getItem(`reminders_${user.uid}`);
    if (storedMeds) {
      try {
        setMedicines(JSON.parse(storedMeds));
      } catch (e) {
        console.error("Failed to parse medicines", e);
      }
    }
    
    // Calculate adherence
    const historyKey = `reminder_history_${user.uid}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    // Simple adherence calculation: (taken / total expected) * 100
    // For now, just a mock calculation based on history length vs meds length
    if (medicines.length > 0) {
      const expected = medicines.length * 7; // Assuming 1 per day for a week
      const taken = history.length;
      const pct = Math.min(100, Math.round((taken / expected) * 100));
      setAdherence(pct || 0);
    }
  }, [user, medicines.length]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const newMedicine = {
      id: Date.now().toString(),
      userId: user.uid,
      name: newMed.name,
      dosage: newMed.dosage,
      time: newMed.time,
      frequency: newMed.frequency,
      startDate: newMed.startDate,
      endDate: newMed.endDate,
      category: newMed.category,
      usage: newMed.usage,
      sideEffects: newMed.sideEffects,
      missedDose: newMed.missedDose,
      createdAt: new Date().toISOString()
    };

    const updatedMeds = [...medicines, newMedicine];
    setMedicines(updatedMeds);
    localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(updatedMeds));
    
    setShowAdd(false);
    setNewMed({ name: '', dosage: '', time: '', frequency: 'daily', startDate: '', endDate: '', category: 'General', usage: '', sideEffects: '', missedDose: '' });
  };

  const [selectedMed, setSelectedMed] = useState<any>(null);

  const handleDelete = (id: string) => {
    if (!user) return;
    const updatedMeds = medicines.filter(med => med.id !== id);
    setMedicines(updatedMeds);
    localStorage.setItem(`reminders_${user.uid}`, JSON.stringify(updatedMeds));
    setSelectedMed(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight neon-text-blue">Medicines</h1>
          <button 
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 glass-panel text-neon-blue rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-neon-blue/30"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 z-10 relative">
        {/* Adherence Widget */}
        {medicines.length > 0 && !showAdd && !selectedMed && (
          <div className="mb-6 glass-panel p-5 rounded-3xl border border-neon-blue/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center mb-3 relative z-10">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Weekly Adherence</h3>
              <span className="text-2xl font-bold text-neon-blue">{adherence}%</span>
            </div>
            <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/10 relative z-10">
              <div 
                className="h-full bg-gradient-to-r from-neon-blue to-neon-green rounded-full transition-all duration-1000"
                style={{ width: `${adherence}%` }}
              ></div>
            </div>
            {adherence >= 90 ? (
              <p className="text-xs text-neon-green mt-3 font-medium relative z-10">You have taken {adherence}% of your medicines this week. Great job!</p>
            ) : adherence >= 50 ? (
              <p className="text-xs text-neon-orange mt-3 font-medium relative z-10">You're doing okay, but try to be more consistent with your medication.</p>
            ) : (
              <p className="text-xs text-neon-pink mt-3 font-medium relative z-10">Your adherence is low. Please remember to take your medication for better health.</p>
            )}
          </div>
        )}

        {showAdd && (
          <div className="glass-panel p-6 rounded-3xl shadow-md border border-neon-blue/30 mb-6">
            <h3 className="font-bold text-xl mb-6 text-white neon-text-blue">Add Medicine</h3>
            <form onSubmit={handleAdd} className="space-y-5">
              <input type="text" placeholder="Medicine Name" required value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" />
              
              <select value={newMed.category} onChange={e => setNewMed({...newMed, category: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors appearance-none">
                <option value="General" className="bg-gray-900">General</option>
                <option value="Blood Pressure" className="bg-gray-900">Blood Pressure</option>
                <option value="Diabetes" className="bg-gray-900">Diabetes</option>
                <option value="Antibiotic" className="bg-gray-900">Antibiotic</option>
                <option value="Painkiller" className="bg-gray-900">Painkiller</option>
                <option value="Vitamins" className="bg-gray-900">Vitamins</option>
              </select>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Dosage (e.g. 500mg)" required value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" />
                <input type="time" required value={newMed.time} onChange={e => setNewMed({...newMed, time: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" style={{ colorScheme: 'dark' }} />
              </div>
              <select value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors appearance-none">
                <option value="daily" className="bg-gray-900">Daily</option>
                <option value="weekly" className="bg-gray-900">Weekly</option>
                <option value="as-needed" className="bg-gray-900">As Needed</option>
              </select>
              
              <textarea placeholder="Usage Information (What is it used for?)" value={newMed.usage} onChange={e => setNewMed({...newMed, usage: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors resize-none h-24" />
              <textarea placeholder="Side Effects Awareness" value={newMed.sideEffects} onChange={e => setNewMed({...newMed, sideEffects: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors resize-none h-24" />
              <textarea placeholder="Missed Dose Handling Suggestions" value={newMed.missedDose} onChange={e => setNewMed({...newMed, missedDose: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors resize-none h-24" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">Start Date</label>
                  <input type="date" required value={newMed.startDate} onChange={e => setNewMed({...newMed, startDate: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">End Date</label>
                  <input type="date" required value={newMed.endDate} onChange={e => setNewMed({...newMed, endDate: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-white/5 rounded-xl border border-white/10 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-neon-blue/10 text-neon-blue font-bold rounded-xl hover:bg-neon-blue/20 border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-colors">Save</button>
              </div>
            </form>
          </div>
        )}

        {selectedMed && !showAdd && (
          <div className="glass-panel p-6 rounded-3xl shadow-md border border-neon-blue/30 mb-6 relative">
            <button 
              onClick={() => setSelectedMed(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-neon-blue/10 text-neon-blue rounded-2xl flex items-center justify-center border border-neon-blue/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                <Pill className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">{selectedMed.name}</h2>
                <p className="text-neon-blue font-medium">{selectedMed.dosage} • {selectedMed.time}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</h4>
                <p className="text-white">{selectedMed.category || 'General'}</p>
              </div>
              
              {selectedMed.usage && (
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Usage Information</h4>
                  <p className="text-white text-sm leading-relaxed">{selectedMed.usage}</p>
                </div>
              )}

              {selectedMed.sideEffects && (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Side Effects Awareness</h4>
                  <p className="text-white text-sm leading-relaxed">{selectedMed.sideEffects}</p>
                </div>
              )}

              {selectedMed.missedDose && (
                <div className="bg-neon-orange/10 p-4 rounded-xl border border-neon-orange/20">
                  <h4 className="text-xs font-bold text-neon-orange uppercase tracking-wider mb-1">Missed Dose Handling</h4>
                  <p className="text-white text-sm leading-relaxed">{selectedMed.missedDose}</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleDelete(selectedMed.id)}
              className="w-full mt-6 py-4 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 border border-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" /> Delete Medicine
            </button>
          </div>
        )}

        {!showAdd && !selectedMed && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Today's Schedule</h2>
            {medicines.length === 0 && (
              <div className="text-center py-16 text-gray-500 glass-panel rounded-3xl border border-white/5">
                <Pill className="w-16 h-16 mx-auto mb-4 opacity-50 text-neon-blue" />
                <p className="text-lg">No medicines added yet.</p>
              </div>
            )}
            {medicines.map(med => (
              <div 
                key={med.id} 
                onClick={() => setSelectedMed(med)}
                className="glass-panel p-5 rounded-2xl shadow-sm border border-white/10 flex items-center gap-4 hover:border-neon-blue/30 transition-colors group cursor-pointer"
              >
                <div className="w-14 h-14 bg-neon-blue/10 text-neon-blue rounded-xl flex items-center justify-center shrink-0 border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                  <Pill className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg tracking-wide">{med.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{med.dosage} • <span className="capitalize">{med.frequency}</span></p>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <span className="text-neon-green font-bold bg-neon-green/10 border border-neon-green/30 px-3 py-1 rounded-lg text-sm shadow-[0_0_8px_rgba(0,255,102,0.2)]">{med.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  );
}
