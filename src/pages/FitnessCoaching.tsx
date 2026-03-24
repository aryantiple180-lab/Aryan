import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Activity, Flame, Clock, Play, CheckCircle, Apple, MessageSquare, Send, Mic, Volume2, VolumeX, ChevronLeft, ArrowRight, Target, User, HeartPulse, Droplets, Moon, X, AlertTriangle, PhoneCall } from 'lucide-react';
import { getGemini } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface UserProfile {
  age: string;
  height: string;
  weight: string;
  gender: string;
  goal: string;
  activityLevel: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  calories: number;
  image: string;
  instructions: string;
}

interface DietPlan {
  breakfast: { name: string; benefits: string; calories: number };
  lunch: { name: string; benefits: string; calories: number };
  dinner: { name: string; benefits: string; calories: number };
  snack: { name: string; benefits: string; calories: number };
  water: string;
}

interface FitnessPlan {
  workouts: Exercise[];
  diet: DietPlan;
  dailyCalories: number;
}

const elderlyWorkoutPlan = {
  day1: [
    { name: "Breathing Exercises", duration: 300, reps: 0, image: "breathing exercise elderly", instructions: "Inhale deeply through your nose, exhale slowly through your mouth.", benefits: "Improves lung capacity and reduces stress." },
    { name: "Arm Stretching", duration: 0, reps: 10, image: "arm stretching elderly", instructions: "Extend arms forward and gently stretch.", benefits: "Arm stretching improves blood circulation and flexibility." },
    { name: "Slow Walking", duration: 300, reps: 0, image: "slow walking elderly", instructions: "Walk slowly at a comfortable pace.", benefits: "Improves cardiovascular health and joint mobility." }
  ],
  day2: [
    { name: "Chair Sitting Exercise", duration: 0, reps: 10, image: "chair sitting exercise elderly", instructions: "Sit and stand from a chair slowly.", benefits: "Strengthens leg muscles and improves balance." },
    { name: "Neck Rotation", duration: 0, reps: 10, image: "neck rotation elderly", instructions: "Slowly rotate your neck left and right.", benefits: "Relieves neck tension and improves mobility." },
    { name: "Leg Raises", duration: 0, reps: 10, image: "leg raises elderly", instructions: "While seated, raise one leg at a time.", benefits: "Strengthens lower body without straining joints." }
  ],
  day3: [
    { name: "Chair Yoga (Seated Cat-Cow)", duration: 300, reps: 0, image: "chair yoga elderly", instructions: "Sit with feet flat. Inhale, arch back (Cow). Exhale, round spine (Cat).", benefits: "Improves spinal flexibility and posture." },
    { name: "Seated Forward Bend", duration: 0, reps: 5, image: "seated forward bend elderly", instructions: "Sit tall, hinge at hips, and reach towards your toes.", benefits: "Stretches hamstrings and lower back." },
    { name: "Ankle Rotations", duration: 0, reps: 15, image: "ankle rotation elderly", instructions: "Lift one foot and rotate the ankle clockwise, then counter-clockwise.", benefits: "Improves ankle mobility and circulation." }
  ]
};

export default function FitnessCoaching() {
  const { user } = useAuth();
  const [view, setView] = useState<'setup' | 'dashboard' | 'workout' | 'celebration' | 'chat'>('setup');
  const [isSeniorMode, setIsSeniorMode] = useState(false);
  const [seniorDay, setSeniorDay] = useState<'day1' | 'day2' | 'day3'>('day1');
  const [profile, setProfile] = useState<UserProfile>({
    age: '', height: '', weight: '', gender: 'Male', goal: 'Weight Loss', activityLevel: 'Moderate'
  });
  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Workout state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem(`fitnessProfile_${user?.uid}`);
    const savedPlan = localStorage.getItem(`fitnessPlan_${user?.uid}`);
    if (savedProfile && savedPlan) {
      setProfile(JSON.parse(savedProfile));
      setPlan(JSON.parse(savedPlan));
      setView('dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (view === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, view]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const ai = getGemini();
      const prompt = `Generate a personalized fitness and diet plan based on the following user profile:
      Age: ${profile.age}
      Height: ${profile.height} cm
      Weight: ${profile.weight} kg
      Gender: ${profile.gender}
      Goal: ${profile.goal}
      Activity Level: ${profile.activityLevel}

      Return ONLY a valid JSON object with the following structure:
      {
        "dailyCalories": number,
        "workouts": [
          {
            "name": "Exercise Name",
            "sets": number,
            "reps": number,
            "calories": number,
            "image": "A descriptive keyword for an image search (e.g., 'pushups workout', 'squats exercise')",
            "instructions": "Brief instructions on how to perform the exercise"
          }
        ],
        "diet": {
          "breakfast": { "name": "Meal name", "benefits": "Brief benefits", "calories": number },
          "lunch": { "name": "Meal name", "benefits": "Brief benefits", "calories": number },
          "dinner": { "name": "Meal name", "benefits": "Brief benefits", "calories": number },
          "snack": { "name": "Meal name", "benefits": "Brief benefits", "calories": number },
          "water": "Recommended daily water intake in liters"
        }
      }
      Ensure the plan has exactly 5 workouts.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const generatedPlan: FitnessPlan = JSON.parse(response.text || '{}');
      
      // Map image keywords to picsum images
      generatedPlan.workouts = generatedPlan.workouts.map(w => ({
        ...w,
        image: `https://picsum.photos/seed/${encodeURIComponent(w.image)}/400/300`
      }));

      setPlan(generatedPlan);
      localStorage.setItem(`fitnessProfile_${user?.uid}`, JSON.stringify(profile));
      localStorage.setItem(`fitnessPlan_${user?.uid}`, JSON.stringify(generatedPlan));
      setView('dashboard');
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    setCurrentExerciseIndex(0);
    setWorkoutTimer(0);
    setCompletedSets(0);
    setIsWorkoutActive(true);
    setView('workout');
    if (isSeniorMode) {
      speakResponse("Starting your workout. Please consult your doctor before starting any exercise. Let's begin slowly.");
    }
  };

  const nextSet = () => {
    if (isSeniorMode) {
      const currentExercise = elderlyWorkoutPlan[seniorDay][currentExerciseIndex];
      if (currentExerciseIndex + 1 >= elderlyWorkoutPlan[seniorDay].length) {
        finishWorkout();
      } else {
        setCurrentExerciseIndex(prev => prev + 1);
        setCompletedSets(0);
        setWorkoutTimer(0);
        speakResponse(`Great job. Take a short break. Next exercise is ${elderlyWorkoutPlan[seniorDay][currentExerciseIndex + 1].name}.`);
      }
      return;
    }

    if (!plan) return;
    const currentExercise = plan.workouts[currentExerciseIndex];
    if (completedSets + 1 >= currentExercise.sets) {
      // Move to next exercise or finish
      if (currentExerciseIndex + 1 >= plan.workouts.length) {
        finishWorkout();
      } else {
        setCurrentExerciseIndex(prev => prev + 1);
        setCompletedSets(0);
      }
    } else {
      setCompletedSets(prev => prev + 1);
    }
  };

  const finishWorkout = () => {
    setIsWorkoutActive(false);
    setView('celebration');
    if (isSeniorMode) {
      speakResponse("Great job! You completed today's workout.");
    }

    if (user) {
      const today = new Date().toLocaleDateString();
      const lastWorkoutDate = localStorage.getItem(`last_workout_date_${user.uid}`);
      
      if (lastWorkoutDate !== today) {
        const currentStreak = parseInt(localStorage.getItem(`streak_${user.uid}`) || '0', 10);
        const newStreak = currentStreak + 1;
        localStorage.setItem(`streak_${user.uid}`, newStreak.toString());
        localStorage.setItem(`last_workout_date_${user.uid}`, today);

        const currentBadges = JSON.parse(localStorage.getItem(`badges_${user.uid}`) || '[]');
        if (newStreak === 7 && !currentBadges.includes('7-Day Streak')) {
          const newBadges = [...currentBadges, '7-Day Streak'];
          localStorage.setItem(`badges_${user.uid}`, JSON.stringify(newBadges));
        }
      }
    }
  };

  const speakResponse = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => setChatInput(event.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = getGemini();
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are an expert AI Fitness Coach. The user's goal is ${profile.goal}. Provide helpful, concise advice on workouts, diet, and lifestyle.`
        }
      });

      // Send previous context
      for (const msg of chatMessages) {
        await chat.sendMessage({ message: msg.text });
      }

      const response = await chat.sendMessage({ message: userMsg });
      const responseText = response.text || 'I am here to help.';
      setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
      speakResponse(responseText);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Views ---

  const renderSetup = () => (
    <div className="flex-1 p-6 overflow-y-auto pb-24 relative z-10">
      <div className="text-center mb-8 pt-8">
        <div className="w-20 h-20 bg-neon-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)]">
          <Target className="w-10 h-10 text-neon-blue" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Personalize Your Plan</h1>
        <p className="text-gray-400 mt-2">Tell us about yourself to get a custom fitness and diet plan.</p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Age</label>
            <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" placeholder="Years" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Gender</label>
            <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors appearance-none">
              <option className="bg-gray-900">Male</option>
              <option className="bg-gray-900">Female</option>
              <option className="bg-gray-900">Other</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Height (cm)</label>
            <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" placeholder="cm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Weight (kg)</label>
            <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors" placeholder="kg" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Fitness Goal</label>
          <select value={profile.goal} onChange={e => setProfile({...profile, goal: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors appearance-none">
            <option className="bg-gray-900">Weight Loss</option>
            <option className="bg-gray-900">Muscle Gain</option>
            <option className="bg-gray-900">Stay Fit</option>
            <option className="bg-gray-900">Improve Stamina</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Daily Activity Level</label>
          <select value={profile.activityLevel} onChange={e => setProfile({...profile, activityLevel: e.target.value})} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors appearance-none">
            <option className="bg-gray-900">Low</option>
            <option className="bg-gray-900">Moderate</option>
            <option className="bg-gray-900">High</option>
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generatePlan}
          disabled={loading || !profile.age || !profile.height || !profile.weight}
          className="w-full mt-8 bg-neon-blue/20 text-neon-blue font-bold py-4 rounded-xl hover:bg-neon-blue/30 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:border-white/10 disabled:text-gray-500 tracking-wide uppercase"
        >
          {loading ? <div className="w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div> : <>Generate My Plan <ArrowRight className="w-5 h-5" /></>}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsSeniorMode(true);
            setView('dashboard');
          }}
          className="w-full mt-4 bg-neon-green/10 text-neon-green font-bold py-4 rounded-xl hover:bg-neon-green/20 transition-colors border border-neon-green/50 shadow-[0_0_15px_rgba(57,255,20,0.1)] flex items-center justify-center gap-2 tracking-wide uppercase"
        >
          Skip to Senior Fitness Mode
        </motion.button>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!plan && !isSeniorMode) return null;
    
    if (isSeniorMode) {
      return (
        <div className="flex-1 overflow-y-auto pb-24 relative z-10">
          <div className="bg-black/40 border-b border-white/10 text-white p-6 pb-8 rounded-b-[32px] shadow-lg relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/20 to-neon-blue/20 opacity-30"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-wide">Senior Fitness</h1>
                  <p className="text-neon-green text-sm mt-1 uppercase tracking-wider">Low-Impact Exercises</p>
                </div>
                <button onClick={() => setIsSeniorMode(false)} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                  Regular Plan
                </button>
              </div>
              
              <div className="glass-panel rounded-2xl p-5 border border-neon-orange/30 bg-neon-orange/5 mb-4 flex gap-3 items-start">
                <AlertTriangle className="w-6 h-6 text-neon-orange shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-neon-orange text-sm">Safety First Approach</h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">Please consult your doctor before starting any exercise. These are easy, low-impact exercises designed for users aged 50+.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 -mt-4 pt-8 space-y-8">
            <section>
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button onClick={() => setSeniorDay('day1')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${seniorDay === 'day1' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'text-gray-400 hover:text-white'}`}>Day 1</button>
                  <button onClick={() => setSeniorDay('day2')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${seniorDay === 'day2' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'text-gray-400 hover:text-white'}`}>Day 2</button>
                  <button onClick={() => setSeniorDay('day3')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${seniorDay === 'day3' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'text-gray-400 hover:text-white'}`}>Day 3</button>
                </div>
                <button onClick={startWorkout} className="text-neon-green font-bold flex items-center gap-2 bg-neon-green/10 px-4 py-2 rounded-xl border border-neon-green/50 shadow-[0_0_10px_rgba(57,255,20,0.2)] hover:bg-neon-green/20 transition-colors uppercase tracking-wider text-sm">
                  <Play className="w-4 h-4" /> Start
                </button>
              </div>
              <div className="space-y-4">
                {elderlyWorkoutPlan[seniorDay].map((workout, idx) => (
                  <motion.div key={idx} whileHover={{ scale: 1.02 }} className="glass-panel rounded-2xl p-4 shadow-sm border border-white/10 flex gap-4 items-center hover:border-neon-green/30 transition-colors group">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <img src={`https://picsum.photos/seed/${encodeURIComponent(workout.image)}/400/300`} alt={workout.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white tracking-wide text-lg">{workout.name}</h3>
                      <p className="text-sm text-neon-green mt-1 font-medium">{workout.duration ? `${workout.duration / 60} mins` : `${workout.reps} reps`}</p>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">{workout.benefits}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto pb-24 relative z-10">
        <div className="bg-black/40 border-b border-white/10 text-white p-6 pb-8 rounded-b-[32px] shadow-lg relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 opacity-30"></div>
          <div className="absolute inset-0 opacity-10 mix-blend-overlay">
            <img src="https://picsum.photos/seed/fitness-gym-workout/800/400" alt="Gym Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-wide">Your Fitness Plan</h1>
                <p className="text-neon-blue text-sm mt-1 uppercase tracking-wider">Goal: {profile.goal}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsSeniorMode(true)} className="text-xs bg-neon-green/10 text-neon-green px-3 py-1.5 rounded-lg border border-neon-green/30 hover:bg-neon-green/20 transition-colors whitespace-nowrap">
                  Senior Mode
                </button>
                <button onClick={() => setView('chat')} className="w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                  <MessageSquare className="w-5 h-5 text-neon-blue" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-2 text-neon-pink mb-2">
                  <Flame className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-wider font-bold">Daily Target</span>
                </div>
                <p className="text-3xl font-bold text-white">{plan.dailyCalories} <span className="text-sm font-normal text-gray-400">kcal</span></p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-2 text-neon-green mb-2">
                  <Dumbbell className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-wider font-bold">Workouts</span>
                </div>
                <p className="text-3xl font-bold text-white">{plan.workouts.length} <span className="text-sm font-normal text-gray-400">exercises</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 -mt-4 pt-8 space-y-8">
          {/* Daily Workout */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white tracking-wide">Today's Workout</h2>
              <button onClick={startWorkout} className="text-neon-green font-bold flex items-center gap-2 bg-neon-green/10 px-4 py-2 rounded-xl border border-neon-green/50 shadow-[0_0_10px_rgba(57,255,20,0.2)] hover:bg-neon-green/20 transition-colors uppercase tracking-wider text-sm">
                <Play className="w-4 h-4" /> Start
              </button>
            </div>
            <div className="space-y-4">
              {plan.workouts.map((workout, idx) => (
                <motion.div key={idx} whileHover={{ scale: 1.02 }} className="glass-panel rounded-2xl p-4 shadow-sm border border-white/10 flex gap-4 items-center hover:border-neon-blue/30 transition-colors group">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                    <img src={workout.image} alt={workout.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white tracking-wide">{workout.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{workout.sets} sets × {workout.reps} reps</p>
                    <div className="flex items-center gap-1 text-neon-pink text-xs font-bold mt-2 bg-neon-pink/10 w-fit px-2 py-1 rounded-md border border-neon-pink/30">
                      <Flame className="w-3 h-3" /> {workout.calories} kcal
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Diet Plan */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 tracking-wide">Diet Recommendations</h2>
            <div className="grid gap-4">
              {[
                { title: 'Breakfast', data: plan.diet.breakfast, icon: Apple, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
                { title: 'Lunch', data: plan.diet.lunch, icon: Activity, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
                { title: 'Snack', data: plan.diet.snack, icon: HeartPulse, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/30' },
                { title: 'Dinner', data: plan.diet.dinner, icon: Moon, color: 'text-neon-pink', bg: 'bg-neon-pink/10', border: 'border-neon-pink/30' },
              ].map((meal, idx) => (
                <div key={idx} className="glass-panel rounded-2xl p-5 shadow-sm border border-white/10 hover:border-white/30 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${meal.bg} ${meal.color} border ${meal.border}`}>
                      <meal.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white tracking-wide">{meal.title}</h3>
                      <p className="text-sm font-medium text-gray-400">{meal.data.name}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className={`text-sm font-bold ${meal.color}`}>{meal.data.calories} kcal</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 ml-16">{meal.data.benefits}</p>
                </div>
              ))}
              
              <div className="glass-panel rounded-2xl p-5 border border-neon-blue/30 flex items-center gap-4 bg-neon-blue/5">
                <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center shrink-0 border border-neon-blue/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                  <Droplets className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-wide">Hydration</h3>
                  <p className="text-sm text-gray-400">Drink at least <span className="font-bold text-neon-blue">{plan.diet.water}</span> today.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderWorkout = () => {
    if (!plan && !isSeniorMode) return null;
    
    const currentExercise = isSeniorMode 
      ? elderlyWorkoutPlan[seniorDay][currentExerciseIndex] 
      : plan!.workouts[currentExerciseIndex];
      
    const totalExercises = isSeniorMode ? elderlyWorkoutPlan[seniorDay].length : plan!.workouts.length;
    
    let progress = 0;
    if (isSeniorMode) {
      const exercise = currentExercise as any;
      progress = ((currentExerciseIndex * 100) + (exercise.duration ? (workoutTimer / exercise.duration) * 100 : 100)) / totalExercises;
    } else {
      progress = ((currentExerciseIndex * 100) + ((completedSets / (currentExercise as Exercise).sets) * 100)) / totalExercises;
    }

    return (
      <div className="flex-1 flex flex-col bg-[#050a1f] text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="p-6 flex justify-between items-center relative z-10">
          <button onClick={() => setIsWorkoutActive(false)} className="w-12 h-12 glass-panel rounded-full flex items-center justify-center border border-white/10 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-xs text-neon-blue uppercase tracking-widest font-bold mb-1">Exercise {currentExerciseIndex + 1} of {totalExercises}</p>
            <p className="font-mono text-2xl font-bold tracking-widest">{formatTime(workoutTimer)}</p>
          </div>
          <button onClick={() => alert('SOS Alert Sent!')} className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-500/30 transition-colors">
            <PhoneCall className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full h-1.5 bg-black/50 relative z-10">
          <motion.div 
            className="h-full bg-neon-green shadow-[0_0_10px_rgba(57,255,20,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
          <div className="relative w-64 h-64 mb-8">
            <div className="absolute inset-0 bg-neon-blue/20 blur-2xl rounded-full"></div>
            <img src={isSeniorMode ? `https://picsum.photos/seed/${encodeURIComponent(currentExercise.image)}/400/300` : currentExercise.image} alt={currentExercise.name} className="w-full h-full object-cover rounded-3xl shadow-[0_0_30px_rgba(0,243,255,0.2)] border border-white/10 relative z-10" referrerPolicy="no-referrer" />
          </div>
          
          <h2 className="text-3xl font-bold mb-3 tracking-wide neon-text-blue">{currentExercise.name}</h2>
          <p className="text-gray-400 mb-10 max-w-md leading-relaxed text-lg">{currentExercise.instructions}</p>
          
          {!isSeniorMode && (
            <div className="flex items-center gap-10 mb-12 glass-panel p-6 rounded-3xl border border-white/10">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Sets</p>
                <p className="text-5xl font-bold text-neon-green" style={{ textShadow: '0 0 15px rgba(57,255,20,0.5)' }}>{completedSets} <span className="text-2xl text-gray-500" style={{ textShadow: 'none' }}>/ {(currentExercise as Exercise).sets}</span></p>
              </div>
              <div className="w-px h-16 bg-white/20"></div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Reps</p>
                <p className="text-5xl font-bold text-white">{currentExercise.reps}</p>
              </div>
            </div>
          )}

          {isSeniorMode && currentExercise.reps > 0 && (
            <div className="mb-12 glass-panel p-6 rounded-3xl border border-white/10 min-w-[200px]">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Target Reps</p>
              <p className="text-5xl font-bold text-white">{currentExercise.reps}</p>
            </div>
          )}

          {isSeniorMode && (
            <div className="mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl text-red-400">
              <HeartPulse className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-medium">Heart Rate: {75 + Math.floor(workoutTimer / 10)} BPM</span>
              {workoutTimer > 120 && <span className="text-xs ml-2 bg-red-500/20 px-2 py-1 rounded-md">Please take a rest</span>}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={nextSet}
            className="w-full max-w-xs bg-neon-blue/20 text-neon-blue font-bold py-5 rounded-2xl text-xl hover:bg-neon-blue/30 transition-colors border border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.3)] uppercase tracking-widest"
          >
            {(!isSeniorMode && completedSets + 1 >= (currentExercise as Exercise).sets && currentExerciseIndex + 1 >= totalExercises) || (isSeniorMode && currentExerciseIndex + 1 >= totalExercises) ? 'Finish Workout' : 'Next'}
          </motion.button>
        </div>
      </div>
    );
  };

  const renderCelebration = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050a1f] text-white p-6 text-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-neon-green/20 to-transparent opacity-50"></div>
      <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-neon-green/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-32 h-32 bg-neon-green/20 rounded-full flex items-center justify-center mb-8 border-2 border-neon-green shadow-[0_0_50px_rgba(57,255,20,0.5)] relative z-10"
      >
        <CheckCircle className="w-20 h-20 text-neon-green" />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-bold mb-4 tracking-wider neon-text-green"
      >
        Great Job! 🎉
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xl text-gray-300 mb-12 tracking-wide"
      >
        Workout Completed Successfully
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="glass-panel rounded-3xl p-8 w-full max-w-xs mb-12 border border-neon-green/30 shadow-[0_0_20px_rgba(57,255,20,0.1)] relative z-10"
      >
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-400 uppercase tracking-widest text-sm">Duration</span>
          <span className="font-mono font-bold text-2xl text-white">{formatTime(workoutTimer)}</span>
        </div>
        <div className="w-full h-px bg-white/10 mb-6"></div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 uppercase tracking-widest text-sm">Exercises</span>
          <span className="font-mono font-bold text-2xl text-neon-green">{isSeniorMode ? elderlyWorkoutPlan[seniorDay].length : plan?.workouts.length}</span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setView('dashboard')}
        className="bg-neon-green/20 text-neon-green font-bold py-5 px-12 rounded-full text-lg border border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.3)] uppercase tracking-widest relative z-10 hover:bg-neon-green/30 transition-colors"
      >
        Back to Dashboard
      </motion.button>
    </div>
  );

  const renderChat = () => (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-[#050a1f]/80 backdrop-blur-md px-6 pt-12 pb-4 border-b border-white/10 z-10 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="w-12 h-12 bg-neon-blue/20 rounded-full flex items-center justify-center border border-neon-blue/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <Activity className="w-6 h-6 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide leading-tight">AI Coach</h1>
            <p className="text-xs text-neon-green font-bold tracking-widest uppercase flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_5px_rgba(57,255,20,0.8)]"></span> Online
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (voiceEnabled) window.speechSynthesis.cancel();
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${voiceEnabled ? 'bg-neon-blue/20 text-neon-blue border-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'glass-panel text-gray-400 border-white/10 hover:text-white'}`}
        >
          {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-400 mt-10 glass-panel p-8 rounded-3xl border border-white/5 mx-4">
            <Activity className="w-16 h-16 mx-auto text-neon-blue mb-4 opacity-50" />
            <p className="tracking-wide leading-relaxed">Ask me anything about your fitness plan, diet, or exercises!</p>
          </div>
        )}
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-neon-blue/20 text-white rounded-br-sm border border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.1)]' : 'glass-panel border border-white/10 text-gray-200 rounded-bl-sm shadow-sm'}`}>
              {msg.role === 'model' ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="tracking-wide">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass-panel border border-white/10 rounded-2xl rounded-bl-sm p-5 shadow-sm flex gap-3">
              <div className="w-2.5 h-2.5 bg-neon-blue rounded-full animate-bounce shadow-[0_0_5px_rgba(0,243,255,0.8)]"></div>
              <div className="w-2.5 h-2.5 bg-neon-purple rounded-full animate-bounce shadow-[0_0_5px_rgba(176,38,255,0.8)]" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2.5 h-2.5 bg-neon-pink rounded-full animate-bounce shadow-[0_0_5px_rgba(255,20,147,0.8)]" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-[#050a1f]/90 backdrop-blur-md p-4 border-t border-white/10 pb-safe relative z-10">
        <form onSubmit={handleChatSend} className="flex gap-3">
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors border ${isListening ? 'bg-neon-pink/20 text-neon-pink border-neon-pink animate-pulse shadow-[0_0_15px_rgba(255,20,147,0.3)]' : 'glass-panel text-gray-400 border-white/10 hover:text-white'}`}
          >
            <Mic className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask your coach..."
            className="flex-1 bg-black/40 border border-white/10 text-white rounded-full px-6 py-4 outline-none focus:border-neon-blue transition-colors placeholder-gray-500 tracking-wide"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || loading}
            className="w-14 h-14 bg-neon-blue/20 text-neon-blue rounded-full flex items-center justify-center hover:bg-neon-blue/30 transition-colors disabled:opacity-50 shrink-0 border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:shadow-none disabled:border-white/10 disabled:text-gray-500"
          >
            <Send className="w-6 h-6 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a1f] relative overflow-hidden">
      {/* Global Background Effects for Setup/Dashboard */}
      {(view === 'setup' || view === 'dashboard') && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
        </>
      )}

      {view === 'setup' && renderSetup()}
      {view === 'dashboard' && renderDashboard()}
      {view === 'workout' && renderWorkout()}
      {view === 'celebration' && renderCelebration()}
      {view === 'chat' && renderChat()}
      
      {view !== 'workout' && view !== 'celebration' && view !== 'chat' && (
        <div className="relative z-30">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
