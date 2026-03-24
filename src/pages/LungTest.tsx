import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Settings, Play, RotateCcw, Activity, Wind, Volume2, VolumeX, History, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGemini } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TestRecord {
  date: string;
  score: number;
  duration: number;
}

interface SoundSettings {
  voice: boolean;
  sfx: boolean;
  volume: number;
}

export default function LungTest() {
  const { user } = useAuth();
  const [view, setView] = useState<'start' | 'playing' | 'result' | 'history' | 'settings'>('start');
  const [isHolding, setIsHolding] = useState(false);
  const [holdTime, setHoldTime] = useState(0); // in milliseconds
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<TestRecord[]>([]);
  const [settings, setSettings] = useState<SoundSettings>({ voice: true, sfx: true, volume: 1.0 });
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const inhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const holdAudioRef = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(`lungHistory_${user?.uid}`);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedSettings = localStorage.getItem(`lungSettings_${user?.uid}`);
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    // Initialize audio
    inhaleAudioRef.current = new Audio('https://actions.google.com/sounds/v1/weather/wind_fast.ogg');
    holdAudioRef.current = new Audio('https://actions.google.com/sounds/v1/science_fiction/humming_engine.ogg');
    exhaleAudioRef.current = new Audio('https://actions.google.com/sounds/v1/weather/wind_fast.ogg');
    
    if (holdAudioRef.current) holdAudioRef.current.loop = true;

    return () => {
      cancelAnimationFrame(timerRef.current);
      stopAllSounds();
    };
  }, [user]);

  useEffect(() => {
    if (inhaleAudioRef.current) inhaleAudioRef.current.volume = settings.volume;
    if (holdAudioRef.current) holdAudioRef.current.volume = settings.volume * 0.5;
    if (exhaleAudioRef.current) exhaleAudioRef.current.volume = settings.volume;
  }, [settings.volume]);

  const speak = (text: string) => {
    if (!settings.voice || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = settings.volume;
    window.speechSynthesis.speak(utterance);
  };

  const playSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (!settings.sfx || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const stopAllSounds = () => {
    if (inhaleAudioRef.current) { inhaleAudioRef.current.pause(); inhaleAudioRef.current.currentTime = 0; }
    if (holdAudioRef.current) { holdAudioRef.current.pause(); holdAudioRef.current.currentTime = 0; }
    if (exhaleAudioRef.current) { exhaleAudioRef.current.pause(); exhaleAudioRef.current.currentTime = 0; }
  };

  const startTest = () => {
    setView('playing');
    setHoldTime(0);
    speak("Take a deep breath now, then press and hold the button.");
    playSound(inhaleAudioRef);
  };

  const handleHoldStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsHolding(true);
    startTimeRef.current = performance.now();
    stopAllSounds();
    playSound(holdAudioRef);
    speak("Hold your breath.");
    
    const updateTimer = (time: number) => {
      setHoldTime(time - startTimeRef.current);
      timerRef.current = requestAnimationFrame(updateTimer);
    };
    timerRef.current = requestAnimationFrame(updateTimer);
  };

  const handleHoldEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isHolding) return;
    
    setIsHolding(false);
    cancelAnimationFrame(timerRef.current);
    stopAllSounds();
    playSound(exhaleAudioRef);
    speak("Release slowly.");
    
    const durationSeconds = holdTime / 1000;
    calculateScore(durationSeconds);
  };

  const calculateScore = (seconds: number) => {
    let newScore = 0;
    if (seconds >= 9) newScore = 10;
    else if (seconds >= 7) newScore = 8;
    else if (seconds >= 5) newScore = 6;
    else if (seconds >= 3) newScore = 4;
    else if (seconds >= 1) newScore = 2;
    else newScore = 0;

    setScore(newScore);
    
    // Save history
    const newRecord = {
      date: new Date().toLocaleDateString(),
      score: newScore,
      duration: seconds
    };
    const updatedHistory = [...history, newRecord];
    setHistory(updatedHistory);
    localStorage.setItem(`lungHistory_${user?.uid}`, JSON.stringify(updatedHistory));

    // Provide feedback
    setTimeout(() => {
      if (newScore >= 9) {
        speak("Excellent performance! Your lungs are very strong.");
        triggerCelebration();
      } else if (newScore >= 7) {
        speak("Great job! Strong lungs.");
        triggerCelebration();
      } else if (newScore >= 5) {
        speak("Nice work, your lungs are getting stronger.");
      } else if (newScore >= 3) {
        speak("Good start, keep practicing.");
      } else {
        speak("Try again, you can do better.");
      }
      setView('result');
      generateAiSuggestion(newScore);
    }, 1500);
  };

  const triggerCelebration = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0ea5e9', '#38bdf8', '#bae6fd']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0ea5e9', '#38bdf8', '#bae6fd']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const generateAiSuggestion = async (currentScore: number) => {
    setLoadingSuggestion(true);
    try {
      const ai = getGemini();
      const prompt = `The user just completed a lung capacity breath-hold test and scored ${currentScore}/10 (held breath for about ${currentScore} seconds). 
      Provide a short, encouraging health suggestion (2-3 sentences) on how they can improve or maintain their lung health. Mention specific exercises like Pranayama or cardio.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      setAiSuggestion(response.text || 'Keep practicing breathing exercises to improve your lung capacity.');
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
      setAiSuggestion('Practice daily breathing exercises like Pranayama to improve your lung capacity.');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const getScoreMessage = (s: number) => {
    if (s >= 9) return "Excellent lung capacity! Keep maintaining your health.";
    if (s >= 6) return "Your lungs are healthy but can improve with regular exercise.";
    return "Your lung capacity is low. Try breathing exercises and daily walking.";
  };

  const getScoreColor = (s: number) => {
    if (s >= 8) return "text-emerald-500";
    if (s >= 5) return "text-blue-500";
    if (s >= 3) return "text-orange-500";
    return "text-red-500";
  };

  // --- Render Views ---

  const renderStart = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
      <div className="w-32 h-32 bg-neon-blue/10 rounded-full flex items-center justify-center mb-8 border border-neon-blue/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
        <Wind className="w-16 h-16 text-neon-blue" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4 tracking-wide neon-text-blue">Lung Function Test</h2>
      <p className="text-gray-400 mb-12 max-w-xs">
        Measure your lung capacity by holding your breath. Follow the voice instructions and hold the button as long as you can.
      </p>
      
      <div className="w-full max-w-xs glass-panel rounded-2xl p-4 border border-white/10 mb-12">
        <h3 className="font-bold text-gray-300 mb-3 text-sm uppercase tracking-wider">Score Scale</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-red-500 font-medium">0–2</span> <span className="text-gray-400">Weak Lungs</span></div>
          <div className="flex justify-between"><span className="text-[#ff8c00] font-medium">3–5</span> <span className="text-gray-400">Normal Lungs</span></div>
          <div className="flex justify-between"><span className="text-neon-blue font-medium">6–8</span> <span className="text-gray-400">Strong Lungs</span></div>
          <div className="flex justify-between"><span className="text-neon-green font-medium">9–10</span> <span className="text-gray-400">Super Lungs</span></div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startTest}
        className="w-full max-w-xs bg-neon-blue/10 text-neon-blue font-bold py-4 rounded-2xl text-lg hover:bg-neon-blue/20 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] tracking-wide"
      >
        Start Test
      </motion.button>
    </div>
  );

  const renderPlaying = () => {
    const seconds = (holdTime / 1000).toFixed(1);
    const progress = Math.min((holdTime / 10000) * 100, 100); // 10 seconds max for full ring

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">
          {isHolding ? "Hold Your Breath..." : "Take a deep breath..."}
        </h2>

        <div className="relative w-64 h-64 mb-16">
          {/* Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none" stroke="#00f3ff" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              transition={{ duration: 0.1 }}
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,243,255,0.8))' }}
            />
          </svg>
          
          {/* Lungs Illustration */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={isHolding ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={isHolding ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
          >
            <div className="w-32 h-32 bg-neon-blue/10 rounded-full flex items-center justify-center border border-neon-blue/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <Wind className="w-16 h-16 text-neon-blue" />
            </div>
          </motion.div>
        </div>

        <div className="text-4xl font-mono font-bold text-neon-blue mb-12 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
          {seconds}s
        </div>

        <motion.button
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          whileTap={{ scale: 0.9 }}
          className={`w-40 h-40 rounded-full flex items-center justify-center text-2xl font-bold text-white transition-colors border ${isHolding ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] text-red-500' : 'bg-neon-blue/20 border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.4)] text-neon-blue animate-pulse'}`}
          style={{ touchAction: 'none' }} // Prevent scrolling while holding
        >
          {isHolding ? 'RELEASE' : 'HOLD'}
        </motion.button>
        <p className="text-gray-400 mt-6 text-sm tracking-wide">Press and hold the button</p>
      </div>
    );
  };

  const renderResult = () => (
    <div className="flex-1 flex flex-col items-center p-6 text-center overflow-y-auto pb-24 relative z-10">
      <div className="mt-8 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide neon-text-blue">Test Complete</h2>
        <p className="text-gray-400">Here are your results</p>
      </div>

      <div className="w-full max-w-sm glass-panel rounded-3xl p-8 border border-white/10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-purple"></div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-2">Lung Strength Score</p>
        <div className="flex items-baseline justify-center gap-2 mb-4">
          <span className={`text-6xl font-black ${getScoreColor(score)} drop-shadow-[0_0_10px_currentColor]`}>{score}</span>
          <span className="text-2xl text-gray-500 font-bold">/ 10</span>
        </div>
        <p className="text-lg font-bold text-white tracking-wide">{getScoreMessage(score)}</p>
      </div>

      <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-white/10 mb-8 text-left">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-neon-blue" />
          <h3 className="font-bold text-white tracking-wide">AI Health Suggestion</h3>
        </div>
        {loadingSuggestion ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="text-gray-300 text-sm leading-relaxed prose prose-sm prose-invert">
            <ReactMarkdown>{aiSuggestion}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('start')}
          className="flex-1 bg-black/40 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-5 h-5" /> Try Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('history')}
          className="flex-1 bg-neon-blue/10 text-neon-blue font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:bg-neon-blue/20 transition-colors"
        >
          <History className="w-5 h-5" /> History
        </motion.button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24 relative z-10">
      <h2 className="text-2xl font-bold text-white mb-6 mt-4 tracking-wide neon-text-blue">Test History</h2>
      
      {history.length > 0 ? (
        <>
          <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-8 h-64">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Progress Over Time</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }}
                />
                <Line type="monotone" dataKey="score" stroke="#00f3ff" strokeWidth={3} dot={{r: 4, fill: '#00f3ff', strokeWidth: 2, stroke: '#050a1f'}} activeDot={{r: 6, fill: '#00f3ff', stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Recent Tests</h3>
            {[...history].reverse().map((record, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-xl border border-white/10 flex justify-between items-center hover:border-neon-blue/30 transition-colors">
                <div>
                  <p className="font-medium text-white">{record.date}</p>
                  <p className="text-xs text-gray-400">Duration: {record.duration.toFixed(1)}s</p>
                </div>
                <div className={`font-bold text-lg ${getScoreColor(record.score)} drop-shadow-[0_0_5px_currentColor]`}>
                  {record.score} / 10
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <History className="w-16 h-16 mb-4 text-gray-600" />
          <p>No test history yet.</p>
          <button onClick={() => setView('start')} className="mt-4 text-neon-blue font-medium hover:text-white transition-colors">Take your first test</button>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="flex-1 flex flex-col p-6 relative z-10">
      <h2 className="text-2xl font-bold text-white mb-6 mt-4 tracking-wide neon-text-blue">Sound Settings</h2>
      
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-white">Voice Guidance</p>
              <p className="text-xs text-gray-500">AI voice instructions</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={settings.voice} onChange={(e) => {
              const newSettings = {...settings, voice: e.target.checked};
              setSettings(newSettings);
              localStorage.setItem(`lungSettings_${user?.uid}`, JSON.stringify(newSettings));
            }} />
            <div className="w-11 h-6 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue border border-white/10"></div>
          </label>
        </div>
        
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-white">Sound Effects</p>
              <p className="text-xs text-gray-500">Breathing and feedback sounds</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={settings.sfx} onChange={(e) => {
              const newSettings = {...settings, sfx: e.target.checked};
              setSettings(newSettings);
              localStorage.setItem(`lungSettings_${user?.uid}`, JSON.stringify(newSettings));
            }} />
            <div className="w-11 h-6 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue border border-white/10"></div>
          </label>
        </div>

        <div className="p-4">
          <p className="font-medium text-white mb-4">Volume</p>
          <input 
            type="range" 
            min="0" max="1" step="0.1" 
            value={settings.volume} 
            onChange={(e) => {
              const newSettings = {...settings, volume: parseFloat(e.target.value)};
              setSettings(newSettings);
              localStorage.setItem(`lungSettings_${user?.uid}`, JSON.stringify(newSettings));
            }}
            className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-neon-blue border border-white/10"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a1f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="px-4 py-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
            <ChevronLeft className="w-6 h-6 text-white" />
          </Link>
          <h1 className="text-lg font-bold text-white tracking-wide">Self Diagnose</h1>
        </div>
        <div className="flex gap-2">
          {view !== 'settings' && view !== 'playing' && (
            <>
              <button onClick={() => setView('history')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors text-neon-blue border border-white/10">
                <History className="w-5 h-5" />
              </button>
              <button onClick={() => setView('settings')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors text-gray-300 border border-white/10">
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}
          {view === 'settings' && (
            <button onClick={() => setView('start')} className="text-neon-blue font-bold px-2 hover:text-white transition-colors">Done</button>
          )}
        </div>
      </div>

      {view === 'start' && renderStart()}
      {view === 'playing' && renderPlaying()}
      {view === 'result' && renderResult()}
      {view === 'history' && renderHistory()}
      {view === 'settings' && renderSettings()}
    </div>
  );
}
