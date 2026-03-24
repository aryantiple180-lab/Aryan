import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import { Plus, Activity, Heart, Moon, Droplets, Smile, Brain, X, AlertTriangle, Info, CheckCircle, Watch, RefreshCw, Bluetooth, BluetoothOff, TrendingUp, ActivitySquare, Download, PhoneCall, Sparkles, Pill, GlassWater, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { generateGeminiResponse } from '../services/gemini';

interface HealthData {
  steps: number;
  calories: number;
  workout: number;
  weight: number;
  heartRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  sleep: number;
  spo2: number;
  hrv: number;
  stress: string;
  water: number;
  lastUpdated: string;
}

const defaultData: HealthData = {
  steps: 4230,
  calories: 320,
  workout: 25,
  weight: 68,
  heartRate: 72,
  bloodPressureSys: 120,
  bloodPressureDia: 80,
  sleep: 7.5,
  spo2: 98,
  hrv: 45,
  stress: 'Normal',
  water: 1200,
  lastUpdated: new Date().toISOString()
};

const mockHistory = [
  { day: 'Mon', hr: 71, sys: 118, dia: 79, steps: 3000 },
  { day: 'Tue', hr: 75, sys: 122, dia: 81, steps: 4500 },
  { day: 'Wed', hr: 72, sys: 120, dia: 80, steps: 5200 },
  { day: 'Thu', hr: 78, sys: 125, dia: 82, steps: 2100 },
  { day: 'Fri', hr: 70, sys: 119, dia: 78, steps: 6000 },
  { day: 'Sat', hr: 68, sys: 115, dia: 76, steps: 8000 },
  { day: 'Sun', hr: 72, sys: 120, dia: 80, steps: 4230 },
];

export default function Health() {
  const [healthData, setHealthData] = useState<HealthData>(defaultData);
  const [history, setHistory] = useState(mockHistory);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState(''); // For BP diastolic
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trends' | 'alerts' | 'insights'>('dashboard');
  
  // Wearable State
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Insights State
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Medication State (Mock)
  const [medications, setMedications] = useState([
    { id: 1, name: 'Vitamin D', dosage: '1 Pill', time: 'After Breakfast', taken: false, icon: 'pill', color: 'green' },
    { id: 2, name: 'Omega 3', dosage: '2 Pills', time: 'After Dinner', taken: false, icon: 'droplet', color: 'blue' }
  ]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const storedData = localStorage.getItem(`healthProfile_${user.uid}`);
    if (storedData) {
      setHealthData(JSON.parse(storedData));
    }
  }, [user]);

  // Auto-sync if connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (deviceConnected) {
      interval = setInterval(() => {
        handleSync();
      }, 30000); // Auto sync every 30s for demo
    }
    return () => clearInterval(interval);
  }, [deviceConnected]);

  const handleConnectDevice = () => {
    setIsSyncing(true);
    setDeviceError(null);
    setTimeout(() => {
      setIsSyncing(false);
      setDeviceConnected(true);
      handleSync();
    }, 2000);
  };

  const handleDisconnectDevice = () => {
    setDeviceConnected(false);
    setDeviceError(null);
  };

  const handleSync = () => {
    if (!deviceConnected) {
      setDeviceError("Device not connected");
      return;
    }
    setIsSyncing(true);
    setDeviceError(null);
    
    setTimeout(() => {
      // Simulate new data
      const newHr = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
      const newSteps = healthData.steps + Math.floor(Math.random() * 100);
      const newSys = Math.floor(Math.random() * (135 - 110 + 1)) + 110;
      const newDia = Math.floor(Math.random() * (85 - 70 + 1)) + 70;
      
      const newData = {
        ...healthData,
        heartRate: newHr,
        steps: newSteps,
        bloodPressureSys: newSys,
        bloodPressureDia: newDia,
        lastUpdated: new Date().toISOString()
      };
      
      setHealthData(newData);
      if (user) {
        localStorage.setItem(`healthProfile_${user.uid}`, JSON.stringify(newData));
      }
      setIsSyncing(false);
    }, 1500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeMetric) return;

    let newData = { ...healthData, lastUpdated: new Date().toISOString() };
    
    if (activeMetric === 'bloodPressure') {
      newData.bloodPressureSys = Number(inputValue);
      newData.bloodPressureDia = Number(inputValue2);
    } else {
      (newData as any)[activeMetric] = isNaN(Number(inputValue)) ? inputValue : Number(inputValue);
    }

    setHealthData(newData);
    localStorage.setItem(`healthProfile_${user.uid}`, JSON.stringify(newData));
    
    setShowAddModal(false);
    setInputValue('');
    setInputValue2('');
    setActiveMetric(null);
  };

  const openModal = (metric: string) => {
    setActiveMetric(metric);
    if (metric === 'bloodPressure') {
      setInputValue(String(healthData.bloodPressureSys));
      setInputValue2(String(healthData.bloodPressureDia));
    } else {
      setInputValue(String(healthData[metric as keyof HealthData]));
    }
    setShowAddModal(true);
  };

  const toggleMedication = (id: number) => {
    setMedications(meds => meds.map(med => med.id === id ? { ...med, taken: !med.taken } : med));
  };

  const alerts = useMemo(() => {
    const newAlerts = [];
    if (healthData.heartRate > 100) newAlerts.push({ type: 'warning', msg: "High Heart Rate detected. Please rest." });
    if (healthData.heartRate < 50) newAlerts.push({ type: 'warning', msg: "Low Heart Rate detected." });
    if (healthData.bloodPressureSys > 130 || healthData.bloodPressureDia > 85) newAlerts.push({ type: 'danger', msg: "Blood Pressure is elevated. Monitor closely." });
    if (healthData.spo2 < 95) newAlerts.push({ type: 'danger', msg: "Low Blood Oxygen (SpO2). Seek medical advice if unwell." });
    if (healthData.sleep < 6) newAlerts.push({ type: 'info', msg: "Sleep duration is below recommended 7-9 hours." });
    if (healthData.water < 1000) newAlerts.push({ type: 'info', msg: "Hydration is low. Remember to drink water." });
    return newAlerts;
  }, [healthData]);

  const fetchInsights = async () => {
    if (insights) return; // Don't fetch if already fetched
    setLoadingInsights(true);
    try {
      const prompt = `As an AI health assistant, analyze the following health data and provide 3 short, actionable, and encouraging insights or recommendations. Format as a bulleted list.
      Data: 
      - Steps: ${healthData.steps}
      - Heart Rate: ${healthData.heartRate} bpm
      - Blood Pressure: ${healthData.bloodPressureSys}/${healthData.bloodPressureDia} mmHg
      - Sleep: ${healthData.sleep} hours
      - SpO2: ${healthData.spo2}%
      - Water Intake: ${healthData.water} ml
      `;
      const response = await generateGeminiResponse(prompt);
      setInsights(response);
    } catch (error) {
      console.error("Failed to fetch insights", error);
      setInsights("Unable to generate insights at this time. Please try again later.");
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights') {
      fetchInsights();
    }
  }, [activeTab]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Steps,${healthData.steps}\n`
      + `Calories,${healthData.calories}\n`
      + `Workout (min),${healthData.workout}\n`
      + `Heart Rate (bpm),${healthData.heartRate}\n`
      + `Blood Pressure (mmHg),${healthData.bloodPressureSys}/${healthData.bloodPressureDia}\n`
      + `Sleep (hrs),${healthData.sleep}\n`
      + `SpO2 (%),${healthData.spo2}\n`
      + `Water (ml),${healthData.water}\n`
      + `Last Updated,${healthData.lastUpdated}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `health_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSOS = () => {
    // In a real app, this would trigger an emergency call or SMS API
    if (window.confirm("EMERGENCY SOS: Are you sure you want to alert emergency contacts and services with your location and critical health data?")) {
      alert("SOS Triggered! Emergency services and contacts have been notified.");
    }
  };

  const ActivityRings = () => {
    const stepsPercent = Math.min((healthData.steps / 8000) * 100, 100);
    const calPercent = Math.min((healthData.calories / 500) * 100, 100);
    const workoutPercent = Math.min((healthData.workout / 45) * 100, 100);

    const radius1 = 40; 
    const radius2 = 28; 
    const radius3 = 16; 

    const circumference1 = 2 * Math.PI * radius1;
    const circumference2 = 2 * Math.PI * radius2;
    const circumference3 = 2 * Math.PI * radius3;

    return (
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius1} fill="transparent" stroke="#331a00" strokeWidth="10" />
          <circle cx="50" cy="50" r={radius2} fill="transparent" stroke="#1a3300" strokeWidth="10" />
          <circle cx="50" cy="50" r={radius3} fill="transparent" stroke="#001a33" strokeWidth="10" />

          <motion.circle 
            cx="50" cy="50" r={radius1} fill="transparent" stroke="#ff6b00" strokeWidth="10" strokeLinecap="round"
            initial={{ strokeDasharray: `${circumference1} ${circumference1}`, strokeDashoffset: circumference1 }}
            animate={{ strokeDashoffset: circumference1 - (stepsPercent / 100) * circumference1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <motion.circle 
            cx="50" cy="50" r={radius2} fill="transparent" stroke="#a3e635" strokeWidth="10" strokeLinecap="round"
            initial={{ strokeDasharray: `${circumference2} ${circumference2}`, strokeDashoffset: circumference2 }}
            animate={{ strokeDashoffset: circumference2 - (calPercent / 100) * circumference2 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />
          <motion.circle 
            cx="50" cy="50" r={radius3} fill="transparent" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round"
            initial={{ strokeDasharray: `${circumference3} ${circumference3}`, strokeDashoffset: circumference3 }}
            animate={{ strokeDashoffset: circumference3 - (workoutPercent / 100) * circumference3 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] text-white h-full font-sans overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight neon-text-blue">Health Tracker</h1>
          <div className="flex gap-2">
            <button onClick={handleExport} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10" title="Export Report">
              <Download className="w-5 h-5 text-gray-300" />
            </button>
            <button onClick={handleSOS} className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors border border-red-500/50" title="Emergency SOS">
              <PhoneCall className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('trends')} className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'trends' ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white'}`}>Trends</button>
          <button onClick={() => setActiveTab('alerts')} className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-lg transition-colors relative ${activeTab === 'alerts' ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white'}`}>
            Alerts
            {alerts.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>
          <button onClick={() => setActiveTab('insights')} className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'insights' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white'}`}>
            <Sparkles className="w-3 h-3" /> Insights
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6 scrollbar-hide">
        
        {/* Wearable Integration Section */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deviceConnected ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-800 text-gray-400'}`}>
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{deviceConnected ? 'Smartwatch Connected' : 'No Device Connected'}</h3>
              <p className="text-xs text-gray-400">
                {deviceConnected ? `Last sync: ${new Date(healthData.lastUpdated).toLocaleTimeString()}` : 'Connect to track vitals automatically'}
              </p>
              {deviceError && <p className="text-xs text-red-400 mt-1">{deviceError}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {deviceConnected ? (
              <>
                <button onClick={handleSync} disabled={isSyncing} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neon-blue transition-colors">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={handleDisconnectDevice} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                  <BluetoothOff className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={handleConnectDevice} disabled={isSyncing} className="px-3 py-1.5 rounded-lg bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue text-sm font-medium transition-colors flex items-center gap-1">
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
                Connect
              </button>
            )}
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Activity Rings & Stats */}
            <div className="flex items-center gap-6">
              <ActivityRings />
              <div className="flex flex-col gap-4">
                <div className="cursor-pointer" onClick={() => openModal('steps')}>
                  <div className="flex items-center gap-2 text-[#ff6b00] text-sm font-medium mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#ff6b00]"></div> Steps
                  </div>
                  <p className="text-2xl font-bold leading-none">{healthData.steps} <span className="text-sm text-gray-400 font-normal">/ 8000</span></p>
                </div>
                <div className="cursor-pointer" onClick={() => openModal('calories')}>
                  <div className="flex items-center gap-2 text-[#a3e635] text-sm font-medium mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#a3e635]"></div> Calories
                  </div>
                  <p className="text-2xl font-bold leading-none">{healthData.calories} <span className="text-sm text-gray-400 font-normal">/ 500</span></p>
                </div>
                <div className="cursor-pointer" onClick={() => openModal('workout')}>
                  <div className="flex items-center gap-2 text-[#38bdf8] text-sm font-medium mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#38bdf8]"></div> Workout
                  </div>
                  <p className="text-2xl font-bold leading-none">{healthData.workout} <span className="text-sm text-gray-400 font-normal">/ 45m</span></p>
                </div>
              </div>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Heart Rate */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openModal('heartRate')} className="glass-panel rounded-3xl p-5 border border-white/10 cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden group hover:border-neon-pink/50 transition-colors">
                <div>
                  <h3 className="text-gray-300 font-medium mb-1 flex items-center gap-2"><Heart className="w-4 h-4 text-neon-pink" /> Heart Rate</h3>
                  <p className="text-xs text-gray-500">{deviceConnected ? 'Live' : 'Manual'}</p>
                </div>
                <div className="mt-auto">
                  <p className="text-3xl font-bold text-white flex items-baseline gap-1">
                    {healthData.heartRate} <span className="text-sm text-gray-400 font-normal">bpm</span>
                  </p>
                </div>
              </motion.div>

              {/* Blood Pressure */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openModal('bloodPressure')} className="glass-panel rounded-3xl p-5 border border-white/10 cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden group hover:border-neon-blue/50 transition-colors">
                <div>
                  <h3 className="text-gray-300 font-medium mb-1 flex items-center gap-2"><ActivitySquare className="w-4 h-4 text-neon-blue" /> Blood Pressure</h3>
                  <p className="text-xs text-gray-500">Sys / Dia</p>
                </div>
                <div className="mt-auto">
                  <p className="text-2xl font-bold text-white flex items-baseline gap-1">
                    {healthData.bloodPressureSys}/{healthData.bloodPressureDia} <span className="text-xs text-gray-400 font-normal">mmHg</span>
                  </p>
                </div>
              </motion.div>

              {/* Sleep */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openModal('sleep')} className="glass-panel rounded-3xl p-5 border border-white/10 cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden group hover:border-neon-purple/50 transition-colors">
                <div>
                  <h3 className="text-gray-300 font-medium mb-1 flex items-center gap-2"><Moon className="w-4 h-4 text-neon-purple" /> Sleep</h3>
                  <p className="text-xs text-gray-500">Last night</p>
                </div>
                <div className="mt-auto">
                  <p className="text-3xl font-bold text-white flex items-baseline gap-1">
                    {healthData.sleep} <span className="text-sm text-gray-400 font-normal">hrs</span>
                  </p>
                </div>
              </motion.div>

              {/* Blood Oxygen */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openModal('spo2')} className="glass-panel rounded-3xl p-5 border border-white/10 cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden group hover:border-neon-green/50 transition-colors">
                <div>
                  <h3 className="text-gray-300 font-medium mb-1 flex items-center gap-2"><Droplets className="w-4 h-4 text-neon-green" /> Blood Oxygen</h3>
                  <p className="text-xs text-gray-500">SpO2</p>
                </div>
                <div className="mt-auto">
                  <p className="text-3xl font-bold text-white flex items-baseline gap-1">
                    {healthData.spo2} <span className="text-sm text-gray-400 font-normal">%</span>
                  </p>
                </div>
              </motion.div>

            </div>

            {/* Water & Medications */}
            <div className="grid grid-cols-1 gap-4">
              {/* Water Intake */}
              <div className="glass-panel rounded-3xl p-5 border border-white/10 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-300 font-medium flex items-center gap-2"><GlassWater className="w-4 h-4 text-blue-400" /> Hydration</h3>
                    <p className="text-xs text-gray-500">Daily Goal: 2000ml</p>
                  </div>
                  <button onClick={() => openModal('water')} className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-white">{healthData.water}</p>
                  <p className="text-sm text-gray-400 mb-1">ml</p>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
                  <div className="bg-blue-400 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min((healthData.water / 2000) * 100, 100)}%` }}></div>
                </div>
              </div>

              {/* Medications */}
              <div className="glass-panel rounded-3xl p-5 border border-white/10 relative overflow-hidden">
                <h3 className="text-gray-300 font-medium mb-4 flex items-center gap-2"><Pill className="w-4 h-4 text-green-400" /> Medications</h3>
                <div className="space-y-3">
                  {medications.map(med => (
                    <div key={med.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${med.taken ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${med.taken ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                          {med.icon === 'pill' ? <Pill className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${med.taken ? 'text-gray-300 line-through' : 'text-white'}`}>{med.name}</p>
                          <p className="text-xs text-gray-400">{med.dosage} • {med.time}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleMedication(med.id)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${med.taken ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-green-400'}`}
                      >
                        {med.taken && <CheckCircle className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-neon-pink" /> Heart Rate Trend</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff007f" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff007f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="hr" stroke="#ff007f" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ActivitySquare className="w-5 h-5 text-neon-blue" /> Blood Pressure Trend</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="sys" name="Systolic" stroke="#00f3ff" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#b026ff" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  alert.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200' :
                  'bg-blue-500/10 border-blue-500/30 text-blue-200'
                }`}>
                  <AlertTriangle className={`w-6 h-6 shrink-0 ${
                    alert.type === 'danger' ? 'text-red-400' :
                    alert.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                  <div>
                    <h4 className="font-semibold mb-1 capitalize">{alert.type} Alert</h4>
                    <p className="text-sm opacity-90">{alert.msg}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 glass-panel rounded-3xl border border-white/5">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-neon-green/50" />
                <h3 className="text-xl font-semibold text-white mb-2">All Clear</h3>
                <p>Your health metrics are within normal ranges. Keep it up!</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-panel p-6 rounded-3xl border border-neon-purple/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-[50px] pointer-events-none"></div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-neon-purple">
                <Sparkles className="w-6 h-6" /> AI Health Insights
              </h3>
              
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <RefreshCw className="w-8 h-8 text-neon-purple animate-spin" />
                  <p className="text-gray-400 text-sm">Analyzing your health data...</p>
                </div>
              ) : insights ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="space-y-3 text-gray-300 leading-relaxed whitespace-pre-line">
                    {insights}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Unable to load insights.</p>
                  <button onClick={fetchInsights} className="mt-4 px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Data Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold capitalize neon-text-blue">Update {activeMetric?.replace(/([A-Z])/g, ' $1').trim()}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSave}>
                {activeMetric === 'bloodPressure' ? (
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-2">Systolic</label>
                      <input 
                        type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-blue transition-colors text-lg"
                        placeholder="120" required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-2">Diastolic</label>
                      <input 
                        type="number" value={inputValue2} onChange={(e) => setInputValue2(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-blue transition-colors text-lg"
                        placeholder="80" required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">New Value</label>
                    <input 
                      type={activeMetric === 'stress' ? 'text' : 'number'} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-blue transition-colors text-lg"
                      placeholder="Enter value" autoFocus required
                    />
                  </div>
                )}
                <button type="submit" className="w-full bg-neon-blue/10 border border-neon-blue text-neon-blue font-bold py-4 rounded-xl hover:bg-neon-blue/20 transition-colors shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                  Save Record
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#050a1f] border-t border-white/5 relative z-10">
        <BottomNav />
      </div>
    </div>
  );
}
