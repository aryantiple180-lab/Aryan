import React, { useState, useRef, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { Send, Bot, Smile, Frown, Meh, Heart, Mic, Volume2, VolumeX } from 'lucide-react';
import { getGemini } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';

export default function Chatbot() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hello! I am your Mental Health AI Assistant. How are you feeling today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const storedMoods = localStorage.getItem(`moods_${user.uid}`);
    if (storedMoods) {
      const moods = JSON.parse(storedMoods);
      // Check if mood was saved today
      const today = new Date().toDateString();
      const hasTodayMood = moods.some((m: any) => new Date(m.date).toDateString() === today);
      setMoodSaved(hasTodayMood);
    }
  }, [user]);

  const speakResponse = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
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
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const genAI = getGemini();
      const chat = genAI.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a compassionate, professional, and supportive Health & Wellness AI Assistant. Your capabilities include: 1) Mental Health Support (stress, anxiety, sleep). 2) Basic Symptom Checker (ask clarifying questions before giving general advice). 3) First-Aid Guidance (e.g., burns, cuts). 4) Healthy Lifestyle Tips (diet, exercise, weather-based advice). IMPORTANT: Do not provide medical diagnoses or prescribe medication. Always encourage users to seek professional medical help for severe or emergency issues. Keep responses concise and easy to read on a mobile device.'
        }
      });

      const response = await chat.sendMessage({ message: userMessage });
      const responseText = response.text || 'I am here to help.';
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      speakResponse(responseText);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorText = 'Sorry, I am having trouble connecting right now. Please try again later.';
      setMessages(prev => [...prev, { role: 'model', text: errorText }]);
      speakResponse(errorText);
    } finally {
      setLoading(false);
    }
  };

  const saveMood = async (mood: string) => {
    if (!user) return;
    
    const newMood = {
      id: Date.now().toString(),
      userId: user.uid,
      mood,
      date: new Date().toISOString()
    };

    const storedMoods = localStorage.getItem(`moods_${user.uid}`);
    let allMoods = storedMoods ? JSON.parse(storedMoods) : [];
    allMoods.push(newMood);
    localStorage.setItem(`moods_${user.uid}`, JSON.stringify(allMoods));

    setMoodSaved(true);
    const responseText = `I've noted that you're feeling ${mood} today. How can I support you?`;
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    speakResponse(responseText);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neon-blue/10 rounded-full flex items-center justify-center border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <Bot className="w-6 h-6 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight tracking-wide">Wellness AI</h1>
            <p className="text-xs text-neon-green font-medium flex items-center gap-1 tracking-wider uppercase">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,102,0.8)]"></span> Online
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (voiceEnabled) window.speechSynthesis.cancel();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${
            voiceEnabled ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/50 shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'glass-panel text-gray-400 border-white/10 hover:text-white'
          }`}
          title={voiceEnabled ? "Disable Voice Output" : "Enable Voice Output"}
        >
          {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {!moodSaved && (
        <div className="glass-panel p-4 border-b border-white/5 flex flex-col items-center relative z-10">
          <p className="text-sm text-gray-300 font-medium mb-3 tracking-wide">How are you feeling today?</p>
          <div className="flex gap-4">
            <button onClick={() => saveMood('happy')} className="p-3 bg-black/40 border border-white/10 rounded-full shadow-sm hover:border-neon-green hover:bg-neon-green/10 text-neon-green transition-colors"><Smile className="w-6 h-6" /></button>
            <button onClick={() => saveMood('okay')} className="p-3 bg-black/40 border border-white/10 rounded-full shadow-sm hover:border-[#ff8c00] hover:bg-[#ff8c00]/10 text-[#ff8c00] transition-colors"><Meh className="w-6 h-6" /></button>
            <button onClick={() => saveMood('sad')} className="p-3 bg-black/40 border border-white/10 rounded-full shadow-sm hover:border-neon-blue hover:bg-neon-blue/10 text-neon-blue transition-colors"><Frown className="w-6 h-6" /></button>
            <button onClick={() => saveMood('loved')} className="p-3 bg-black/40 border border-white/10 rounded-full shadow-sm hover:border-neon-pink hover:bg-neon-pink/10 text-neon-pink transition-colors"><Heart className="w-6 h-6" /></button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-neon-blue/20 text-white border border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.2)] rounded-br-sm' 
                : 'glass-panel border border-white/10 text-gray-200 shadow-sm rounded-bl-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap tracking-wide">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass-panel border border-white/10 rounded-2xl p-4 rounded-bl-sm shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce shadow-[0_0_5px_rgba(0,243,255,0.8)]"></div>
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce shadow-[0_0_5px_rgba(188,19,254,0.8)]" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce shadow-[0_0_5px_rgba(255,0,127,0.8)]" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && moodSaved && (
        <div className="px-6 pb-2 relative z-10">
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            <button onClick={() => setInput("I have a headache")} className="shrink-0 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple px-4 py-2 rounded-full text-sm font-medium hover:bg-neon-purple/20 transition-colors whitespace-nowrap">
              I have a headache
            </button>
            <button onClick={() => setInput("Diet tips for today")} className="shrink-0 bg-neon-green/10 border border-neon-green/30 text-neon-green px-4 py-2 rounded-full text-sm font-medium hover:bg-neon-green/20 transition-colors whitespace-nowrap">
              Diet tips for today
            </button>
            <button onClick={() => setInput("What to do for a burn?")} className="shrink-0 bg-neon-pink/10 border border-neon-pink/30 text-neon-pink px-4 py-2 rounded-full text-sm font-medium hover:bg-neon-pink/20 transition-colors whitespace-nowrap">
              What to do for a burn?
            </button>
            <button onClick={() => setInput("I can't sleep")} className="shrink-0 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue px-4 py-2 rounded-full text-sm font-medium hover:bg-neon-blue/20 transition-colors whitespace-nowrap">
              I can't sleep
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#050a1f]/80 backdrop-blur-md p-4 border-t border-white/5 pb-safe relative z-10">
        <form onSubmit={handleSend} className="flex gap-2">
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors border ${
              isListening ? 'bg-neon-pink/20 text-neon-pink border-neon-pink shadow-[0_0_15px_rgba(255,0,127,0.4)] animate-pulse' : 'glass-panel text-gray-400 border-white/10 hover:text-white hover:border-white/30'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-3 outline-none focus:border-neon-blue text-white transition-all placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-neon-blue/20 text-neon-blue border border-neon-blue rounded-full flex items-center justify-center hover:bg-neon-blue/30 transition-colors disabled:opacity-50 disabled:hover:bg-neon-blue/20 shrink-0 shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:shadow-none disabled:border-white/10 disabled:text-gray-500"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  );
}
