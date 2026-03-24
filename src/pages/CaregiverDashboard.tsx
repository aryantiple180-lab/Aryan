import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  HeartPulse, 
  Activity, 
  Moon, 
  Pill, 
  Phone, 
  FileText, 
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Droplets,
  Dumbbell,
  Brain
} from 'lucide-react';

export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'reminders' | 'reports'>('overview');
  const [reminders, setReminders] = useState<any[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({ name: '', time: '', dosage: '' });

  const [showReport, setShowReport] = useState<any>(null);

  // Mock data for elderly user
  const elderlyUser = {
    name: 'Sahil (Father)',
    healthScore: 85,
    steps: 4500,
    sleep: '6h 30m',
    heartRate: '72 bpm',
    stressLevel: 'Low',
    waterIntake: '1.5L',
    workout: '20 mins',
    location: 'Home (123 Main St)',
  };

  const mockReports = [
    { id: 1, date: '2026-03-10', type: 'Blood Test', doctor: 'Dr. Smith' },
    { id: 2, date: '2026-02-15', type: 'X-Ray', doctor: 'Dr. Jones' },
    { id: 3, date: '2026-01-20', type: 'Prescription', doctor: 'Dr. Smith' },
  ];

  useEffect(() => {
    // In a real app, fetch reminders for the linked elderly user
    const storedReminders = localStorage.getItem(`reminders_elderly_mock`);
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders));
    } else {
      const initialReminders = [
        { id: '1', name: 'Blood Pressure Med', time: '08:00', dosage: '1 Pill' },
        { id: '2', name: 'Vitamin D', time: '13:00', dosage: '1 Pill' }
      ];
      setReminders(initialReminders);
      localStorage.setItem(`reminders_elderly_mock`, JSON.stringify(initialReminders));
    }
  }, []);

  const handleAddReminder = () => {
    if (newReminder.name && newReminder.time) {
      const updated = [...reminders, { ...newReminder, id: Date.now().toString() }];
      setReminders(updated);
      localStorage.setItem(`reminders_elderly_mock`, JSON.stringify(updated));
      setNewReminder({ name: '', time: '', dosage: '' });
      setShowAddReminder(false);
      alert('Reminder added and synced to elderly user device!');
    }
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem(`reminders_elderly_mock`, JSON.stringify(updated));
  };

  const handleSOS = () => {
    alert(`Emergency Alert!\n${elderlyUser.name} has triggered an SOS alert.\nCurrent Location: ${elderlyUser.location}`);
  };

  const handleCall = () => {
    window.location.href = 'tel:+1234567890';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white tracking-wide">Monitoring: {elderlyUser.name}</h1>
        </div>
        <button onClick={handleCall} className="w-10 h-10 rounded-full bg-neon-green/20 flex items-center justify-center hover:bg-neon-green/30 border border-neon-green/50 transition-colors shadow-[0_0_10px_rgba(57,255,20,0.3)]">
          <Phone className="w-5 h-5 text-neon-green" />
        </button>
      </div>

      <div className="flex px-6 py-4 gap-2 z-10 overflow-x-auto no-scrollbar border-b border-white/5">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'bg-neon-blue text-[#050a1f]' : 'bg-white/5 text-gray-400 border border-white/10'}`}>Overview</button>
        <button onClick={() => setActiveTab('reminders')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'reminders' ? 'bg-neon-blue text-[#050a1f]' : 'bg-white/5 text-gray-400 border border-white/10'}`}>Reminders</button>
        <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'reports' ? 'bg-neon-blue text-[#050a1f]' : 'bg-white/5 text-gray-400 border border-white/10'}`}>Reports</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 relative z-10">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-2xl border border-white/10 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-5 h-5 text-neon-blue" />
                  <span className="text-sm text-gray-400">Medicine Taken Today</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-white">2</p>
                  <p className="text-sm text-gray-400 mb-1">/ 3 doses</p>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-neon-blue h-full rounded-full" style={{ width: '66%' }}></div>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="w-5 h-5 text-neon-pink" />
                  <span className="text-sm text-gray-400">Heart Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">{elderlyUser.heartRate}</p>
                <p className="text-xs text-neon-green mt-1">Normal</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-neon-blue" />
                  <span className="text-sm text-gray-400">Steps</span>
                </div>
                <p className="text-2xl font-bold text-white">{elderlyUser.steps}</p>
                <p className="text-xs text-gray-400 mt-1">Goal: 5000</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-5 h-5 text-neon-purple" />
                  <span className="text-sm text-gray-400">Sleep</span>
                </div>
                <p className="text-2xl font-bold text-white">{elderlyUser.sleep}</p>
                <p className="text-xs text-gray-400 mt-1">Last night</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-neon-orange" />
                  <span className="text-sm text-gray-400">Health Score</span>
                </div>
                <p className="text-2xl font-bold text-white">{elderlyUser.healthScore}/100</p>
                <p className="text-xs text-neon-green mt-1">Good</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-neon-purple" />
                  <span className="text-sm text-gray-400">Stress Level</span>
                </div>
                <p className="text-2xl font-bold text-white">{elderlyUser.stressLevel}</p>
                <p className="text-xs text-neon-green mt-1">Relaxed</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-neon-blue" />
                  <span className="text-sm text-gray-400">Water Intake</span>
                </div>
                <p className="text-2xl font-bold text-white">{elderlyUser.waterIntake}</p>
                <p className="text-xs text-gray-400 mt-1">Goal: 2.5L</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-5 h-5 text-neon-green" />
                  <span className="text-sm text-gray-400">Workout</span>
                </div>
                <p className="text-2xl font-bold text-white">{elderlyUser.workout}</p>
                <p className="text-xs text-gray-400 mt-1">Completed</p>
              </div>
            </div>

            {/* Recent Alerts */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-wide">Recent Alerts</h3>
              <div className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-sm">Missed Medicine</p>
                  <p className="text-xs text-gray-400 mt-1">Blood Pressure Med was missed at 08:00 AM.</p>
                  <button onClick={handleCall} className="mt-2 text-xs font-bold text-neon-blue hover:underline">Call to remind</button>
                </div>
              </div>
            </div>

            {/* Live Location */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-wide">Live Location</h3>
              <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{elderlyUser.location}</p>
                  <p className="text-xs text-gray-400 mt-1">Updated 5 mins ago</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white tracking-wide">Manage Reminders</h3>
              <button onClick={() => setShowAddReminder(true)} className="flex items-center gap-1 text-sm font-bold text-neon-blue bg-neon-blue/10 px-3 py-1.5 rounded-lg border border-neon-blue/30">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {showAddReminder && (
              <div className="glass-panel p-4 rounded-2xl border border-neon-blue/30 mb-4 space-y-3">
                <input type="text" placeholder="Medicine Name" value={newReminder.name} onChange={e => setNewReminder({...newReminder, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neon-blue text-white" />
                <div className="flex gap-2">
                  <input type="time" value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neon-blue text-white" />
                  <input type="text" placeholder="Dosage" value={newReminder.dosage} onChange={e => setNewReminder({...newReminder, dosage: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-neon-blue text-white" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowAddReminder(false)} className="flex-1 py-2 text-xs font-bold text-gray-400 bg-white/5 rounded-xl">Cancel</button>
                  <button onClick={handleAddReminder} className="flex-1 py-2 text-xs font-bold text-[#050a1f] bg-neon-blue rounded-xl">Save & Sync</button>
                </div>
              </div>
            )}

            {reminders.map(reminder => (
              <div key={reminder.id} className="glass-panel p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{reminder.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{reminder.dosage} • {reminder.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteReminder(reminder.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-wide mb-4">Health Reports</h3>
            {mockReports.map(report => (
              <div key={report.id} onClick={() => setShowReport(report)} className="glass-panel p-4 rounded-2xl border border-white/10 flex justify-between items-center hover:border-neon-blue/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neon-blue/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{report.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{report.date} • {report.doctor}</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-neon-blue bg-neon-blue/10 px-3 py-1.5 rounded-lg">View</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReport && (
        <div className="absolute inset-0 z-50 bg-[#050a1f]/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-neon-blue/30 p-6 relative">
            <button onClick={() => setShowReport(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <Plus className="w-6 h-6 rotate-45" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">{showReport.type}</h3>
            <p className="text-sm text-gray-400 mb-6">{showReport.date} • {showReport.doctor}</p>
            
            <div className="bg-white/5 rounded-2xl p-8 flex items-center justify-center border border-white/10 mb-6 h-64">
              <FileText className="w-16 h-16 text-neon-blue/50" />
            </div>
            
            <button className="w-full py-3 bg-neon-blue text-[#050a1f] font-bold rounded-xl hover:bg-neon-blue/90 transition-colors">
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
