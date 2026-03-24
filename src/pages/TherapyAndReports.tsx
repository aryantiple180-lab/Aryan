import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Upload, FileText, Image as ImageIcon, Trash2, Download, Eye, Play, Pause, Square, Clock, Cloud, Music, Droplets, Wind, TreePine, Moon, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import localforage from 'localforage';
import BottomNav from '../components/BottomNav';

interface MedicalReport {
  id: string;
  name: string;
  date: string;
  type: string;
  format: string;
  dataUrl: string; // Base64 or blob URL
  notes?: string;
  aiSummary?: string;
}

const REPORT_TYPES = ['Blood Test', 'X-Ray', 'Prescription', 'Lab Report', 'Other'];

const SOUNDS = [
  { id: 'rain', name: 'Rain Sounds', icon: Droplets, url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', color: 'bg-blue-500' },
  { id: 'ocean', name: 'Ocean Waves', icon: Wind, url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg', color: 'bg-cyan-500' },
  { id: 'meditation', name: 'Meditation Music', icon: Music, url: 'https://actions.google.com/sounds/v1/ambiences/meditation_bell.ogg', color: 'bg-purple-500' },
  { id: 'forest', name: 'Forest Nature', icon: TreePine, url: 'https://actions.google.com/sounds/v1/nature/jungle_ambience_late_night.ogg', color: 'bg-emerald-500' },
  { id: 'ambient', name: 'Soft Ambient Sleep', icon: Moon, url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience_with_crickets.ogg', color: 'bg-indigo-500' },
];

const DURATIONS = [5, 10, 15]; // minutes

export default function TherapyAndReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'sleep'>('reports');
  
  // Reports State
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState(REPORT_TYPES[0]);
  const [uploadName, setUploadName] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sleep Therapy State
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadReports();
    }
    
    audioRef.current = new Audio();
    audioRef.current.loop = true;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [user]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopAudio();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft]);

  // --- Reports Logic ---

  const loadReports = async () => {
    try {
      const storedReports = await localforage.getItem<MedicalReport[]>(`reports_${user?.uid}`);
      if (storedReports) {
        setReports(storedReports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const saveReports = async (newReports: MedicalReport[]) => {
    try {
      await localforage.setItem(`reports_${user?.uid}`, newReports);
      setReports(newReports);
    } catch (error) {
      console.error('Error saving reports:', error);
      alert('Failed to save report. Storage might be full.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      if (!uploadName) {
        setUploadName(file.name.split('.')[0]);
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadName) return;
    
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const newReport: MedicalReport = {
        id: Date.now().toString(),
        name: uploadName,
        date: new Date().toLocaleDateString(),
        type: uploadType,
        format: selectedFile.type.includes('pdf') ? 'pdf' : 'image',
        dataUrl: reader.result as string,
        notes: uploadNotes
      };
      
      await saveReports([newReport, ...reports]);
      setIsUploading(false);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadName('');
      setUploadNotes('');
    };
    reader.readAsDataURL(selectedFile);
  };

  const generateAISummary = async (report: MedicalReport) => {
    setIsGeneratingSummary(true);
    try {
      const { getGemini } = await import('../services/gemini');
      const ai = getGemini();
      const prompt = `Analyze this medical report type: ${report.type}. Name: ${report.name}. Notes: ${report.notes || 'None'}. Provide a brief, easy-to-understand summary of what this type of report generally indicates and what the user should look out for. Keep it under 3 sentences.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      const summary = response.text;
      
      const updatedReports = reports.map(r => 
        r.id === report.id ? { ...r, aiSummary: summary } : r
      );
      await saveReports(updatedReports);
      
      if (previewReport?.id === report.id) {
        setPreviewReport({ ...previewReport, aiSummary: summary });
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate AI summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const updatedReports = reports.filter(r => r.id !== id);
      await saveReports(updatedReports);
      if (previewReport?.id === id) setPreviewReport(null);
    }
  };

  const handleDownloadReport = (report: MedicalReport) => {
    const link = document.createElement('a');
    link.href = report.dataUrl;
    link.download = `${report.name}.${report.format === 'pdf' ? 'pdf' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Sleep Therapy Logic ---

  const playAudio = () => {
    if (!audioRef.current) return;
    
    if (audioRef.current.src !== selectedSound.url) {
      audioRef.current.src = selectedSound.url;
    }
    
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      if (timeLeft === 0) {
        setTimeLeft(selectedDuration * 60);
      }
    }).catch(e => console.error("Audio play failed:", e));
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setTimeLeft(0);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Render Views ---

  const renderReports = () => (
    <div className="p-4 space-y-4 pb-24 relative z-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Digital Health Records</h2>
          <p className="text-sm text-gray-400 mt-1">Securely store your medical documents</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-12 h-12 bg-neon-blue/10 text-neon-blue rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:bg-neon-blue/20 transition-colors border border-neon-blue"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-white/5">
          <Cloud className="w-16 h-16 text-neon-blue mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-2 tracking-wide">No Reports Yet</h3>
          <p className="text-gray-400 text-sm max-w-[200px] mx-auto mb-8">Upload your medical reports to keep them safe and accessible.</p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-neon-blue/10 text-neon-blue font-bold px-8 py-3 rounded-full hover:bg-neon-blue/20 transition-colors border border-neon-blue/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]"
          >
            Upload Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="glass-panel p-5 rounded-2xl shadow-sm border border-white/10 flex items-center gap-4 hover:border-neon-blue/30 transition-colors group">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${report.format === 'pdf' ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-neon-blue/10 text-neon-blue border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]'}`}>
                {report.format === 'pdf' ? <FileText className="w-7 h-7" /> : <ImageIcon className="w-7 h-7" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate text-lg tracking-wide">{report.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md">{report.type}</span>
                  <span className="text-neon-blue">•</span>
                  <span>{report.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setPreviewReport(report)} className="p-2 text-gray-400 hover:text-neon-blue transition-colors">
                  <Eye className="w-5 h-5" />
                </button>
                <button onClick={() => handleDownloadReport(report)} className="p-2 text-gray-400 hover:text-neon-green transition-colors">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-gray-400 hover:text-neon-pink transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050a1f]/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-6 tracking-wide neon-text-blue">Upload Report</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Report Name</label>
                  <input 
                    type="text" 
                    value={uploadName} 
                    onChange={e => setUploadName(e.target.value)}
                    placeholder="e.g., Blood Test Jan 2026"
                    className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Report Type</label>
                  <select 
                    value={uploadType} 
                    onChange={e => setUploadType(e.target.value)}
                    className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors appearance-none"
                  >
                    {REPORT_TYPES.map(type => <option key={type} value={type} className="bg-gray-900">{type}</option>)}
                  </select>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Select File</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-neon-blue/30 bg-neon-blue/5 text-neon-blue hover:bg-neon-blue/10 transition-colors"
                    >
                      <Upload className="w-8 h-8 mb-3" />
                      <span className="text-sm font-bold tracking-wide">From Device</span>
                    </button>
                    <button 
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-neon-green/30 bg-neon-green/5 text-neon-green hover:bg-neon-green/10 transition-colors"
                    >
                      <ImageIcon className="w-8 h-8 mb-3" />
                      <span className="text-sm font-bold tracking-wide">Take Photo</span>
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,image/jpeg,image/png" className="hidden" />
                  <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                </div>

                {selectedFile && (
                  <div className="bg-black/40 p-4 rounded-xl flex items-center gap-3 text-sm border border-white/10">
                    <FileText className="w-5 h-5 text-neon-blue" />
                    <span className="flex-1 truncate text-gray-300">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-neon-pink hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Notes (Optional)</label>
                  <textarea 
                    value={uploadNotes} 
                    onChange={e => setUploadNotes(e.target.value)}
                    placeholder="Add any notes about this report..."
                    className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-neon-blue outline-none transition-colors resize-none h-24"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => { setShowUploadModal(false); setSelectedFile(null); setUploadName(''); }}
                    className="flex-1 py-4 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={!selectedFile || !uploadName || isUploading}
                    className="flex-1 py-4 rounded-xl font-bold text-neon-blue bg-neon-blue/10 hover:bg-neon-blue/20 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:shadow-none disabled:border-white/10 disabled:text-gray-500 flex items-center justify-center gap-2 tracking-wide"
                  >
                    {isUploading ? <div className="w-5 h-5 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div> : 'Save Report'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewReport && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050a1f]/95 backdrop-blur-md z-50 flex flex-col"
          >
            <div className="p-4 flex justify-between items-center bg-black/40 border-b border-white/10 text-white">
              <h3 className="font-bold truncate pr-4 text-lg tracking-wide">{previewReport.name}</h3>
              <button onClick={() => setPreviewReport(null)} className="p-2 glass-panel rounded-full hover:bg-white/10 border border-white/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
              <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                {previewReport.format === 'pdf' ? (
                  <iframe src={previewReport.dataUrl} className="w-full h-full bg-white rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.1)]" title="PDF Preview" />
                ) : (
                  <img src={previewReport.dataUrl} alt="Report Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.1)]" />
                )}
              </div>

              {previewReport.notes && (
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 shrink-0">
                  <h4 className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider">Notes</h4>
                  <p className="text-white text-sm leading-relaxed">{previewReport.notes}</p>
                </div>
              )}

              <div className="bg-neon-blue/10 p-4 rounded-xl border border-neon-blue/30 shrink-0 mb-safe">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-neon-blue flex items-center gap-2 uppercase tracking-wider">
                    <Cloud className="w-4 h-4" /> AI Summary
                  </h4>
                  {!previewReport.aiSummary && (
                    <button 
                      onClick={() => generateAISummary(previewReport)}
                      disabled={isGeneratingSummary}
                      className="text-xs bg-neon-blue/20 text-neon-blue px-3 py-1.5 rounded-lg hover:bg-neon-blue/30 transition-colors disabled:opacity-50 font-bold tracking-wide"
                    >
                      {isGeneratingSummary ? 'Generating...' : 'Generate AI Summary'}
                    </button>
                  )}
                </div>
                {previewReport.aiSummary ? (
                  <p className="text-white text-sm leading-relaxed">{previewReport.aiSummary}</p>
                ) : (
                  <p className="text-neon-blue/60 text-xs italic">Click generate to get an AI summary of this report.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderSleepTherapy = () => (
    <div className="p-6 flex flex-col h-full pb-24 relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white tracking-wide neon-text-purple">Sleep Sound Therapy</h2>
        <p className="text-gray-400 mt-2">Relax and improve your sleep with calming sounds.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {SOUNDS.map(sound => (
          <button
            key={sound.id}
            onClick={() => {
              setSelectedSound(sound);
              if (isPlaying) {
                stopAudio();
              }
            }}
            className={`p-5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-4 ${selectedSound.id === sound.id ? `border-neon-purple bg-neon-purple/10 shadow-[0_0_15px_rgba(176,38,255,0.2)]` : 'border-white/10 glass-panel hover:border-neon-purple/30'}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${sound.color.replace('bg-', 'bg-').replace('500', '500/20')} border ${sound.color.replace('bg-', 'border-').replace('500', '500/50')}`}>
              <sound.icon className={`w-7 h-7 ${sound.color.replace('bg-', 'text-').replace('500', '400')}`} />
            </div>
            <span className="text-sm font-bold text-white text-center tracking-wide">{sound.name}</span>
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-3xl p-8 shadow-lg border border-white/10 mt-auto relative overflow-hidden">
        {/* Active Glow */}
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-neon-purple/5 blur-3xl pointer-events-none"
          />
        )}

        <div className="flex justify-center mb-8 relative z-10">
          <div className="bg-black/40 p-1.5 rounded-full flex gap-2 border border-white/10">
            {DURATIONS.map(duration => (
              <button
                key={duration}
                onClick={() => {
                  setSelectedDuration(duration);
                  if (!isPlaying) setTimeLeft(duration * 60);
                }}
                disabled={isPlaying}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all tracking-wide ${selectedDuration === duration ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.3)]' : 'text-gray-400 hover:text-white border border-transparent'} disabled:opacity-50`}
              >
                {duration} min
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-10 relative z-10">
          <div className="text-6xl font-mono font-bold text-white mb-3 tracking-widest" style={{ textShadow: isPlaying ? '0 0 20px rgba(176,38,255,0.8)' : 'none' }}>
            {formatTime(timeLeft > 0 ? timeLeft : selectedDuration * 60)}
          </div>
          <p className="text-neon-purple font-medium flex items-center justify-center gap-2 tracking-widest uppercase text-sm">
            <Clock className="w-4 h-4" /> Timer
          </p>
        </div>

        <div className="flex justify-center items-center gap-8 relative z-10">
          <button 
            onClick={stopAudio}
            disabled={!isPlaying && timeLeft === 0}
            className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 border border-white/10"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
          
          <button 
            onClick={isPlaying ? pauseAudio : playAudio}
            className="w-24 h-24 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple border-2 border-neon-purple shadow-[0_0_30px_rgba(176,38,255,0.4)] hover:bg-neon-purple/30 transition-all transform hover:scale-105"
          >
            {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a1f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-4 py-4 z-10 flex items-center gap-3 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5">
        <Link to="/" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-wide">Therapy & Reports</h1>
      </div>

      <div className="px-4 pt-3 pb-0 border-b border-white/10 sticky top-[72px] z-10 bg-[#050a1f]/90 backdrop-blur-md">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('reports')}
            className={`pb-4 text-sm font-bold transition-colors relative tracking-wide uppercase ${activeTab === 'reports' ? 'text-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Health Reports
            {activeTab === 'reports' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-neon-blue rounded-t-full shadow-[0_0_10px_rgba(0,243,255,0.8)]" />}
          </button>
          <button 
            onClick={() => setActiveTab('sleep')}
            className={`pb-4 text-sm font-bold transition-colors relative tracking-wide uppercase ${activeTab === 'sleep' ? 'text-neon-purple' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Sleep Therapy
            {activeTab === 'sleep' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-neon-purple rounded-t-full shadow-[0_0_10px_rgba(176,38,255,0.8)]" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10">
        {activeTab === 'reports' ? renderReports() : renderSleepTherapy()}
      </div>

      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  );
}
