import React, { useState, useEffect, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { MapPin, Navigation, Phone, Star, Search, Crosshair, Map, Calendar, Activity, Clock, Stethoscope, X } from 'lucide-react';
import { findNearbyHospitals } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState<'initial' | 'requesting' | 'manual' | 'detected'>('initial');
  const [manualLocation, setManualLocation] = useState({ city: '', area: '', pincode: '' });
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({ date: '', time: '', doctor: '' });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if we already have location
    const lat = parseFloat(localStorage.getItem('user_lat') || '0');
    const lng = parseFloat(localStorage.getItem('user_lng') || '0');
    
    if (lat !== 0 && lng !== 0) {
      fetchHospitals(lat, lng);
    }
    
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const fetchHospitals = async (lat?: number, lng?: number, query?: string) => {
    setLoading(true);
    setError('');
    try {
      const places = await findNearbyHospitals(lat, lng, query);
      setHospitals(places);
      setLocationStatus('detected');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby hospitals');
      setLocationStatus('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleAllowLocation = () => {
    setLocationStatus('requesting');
    setLoading(true);
    setError('');
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          localStorage.setItem('user_lat', latitude.toString());
          localStorage.setItem('user_lng', longitude.toString());
          fetchHospitals(latitude, longitude);
          
          // Start watching for location changes
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const newLat = pos.coords.latitude;
              const newLng = pos.coords.longitude;
              const oldLat = parseFloat(localStorage.getItem('user_lat') || '0');
              const oldLng = parseFloat(localStorage.getItem('user_lng') || '0');
              
              // Only refresh if moved significantly (e.g., > 1km approx)
              if (Math.abs(newLat - oldLat) > 0.01 || Math.abs(newLng - oldLng) > 0.01) {
                localStorage.setItem('user_lat', newLat.toString());
                localStorage.setItem('user_lng', newLng.toString());
                fetchHospitals(newLat, newLng);
              }
            },
            (err) => console.error('Watch position error:', err),
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 27000 }
          );
        },
        (err) => {
          console.error(err);
          setError('Unable to detect your location. Please enable GPS or enter location manually.');
          setLocationStatus('manual');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocationStatus('manual');
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = `${manualLocation.area}, ${manualLocation.city} ${manualLocation.pincode}`.trim();
    if (query.length > 3) {
      fetchHospitals(undefined, undefined, query);
    }
  };

  const handleBookClick = (hospital: any) => {
    setSelectedHospital(hospital);
    setShowBookingModal(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate booking
    alert(`Appointment booked at ${selectedHospital.name} for ${bookingDetails.date} at ${bookingDetails.time} with ${bookingDetails.doctor}`);
    setShowBookingModal(false);
    setBookingDetails({ date: '', time: '', doctor: '' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5">
        <h1 className="text-2xl font-bold text-white mb-4 tracking-wide neon-text-blue">Nearby Hospitals</h1>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search hospitals, clinics..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-neon-blue outline-none bg-black/40 text-white transition-colors placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        {locationStatus === 'initial' && hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-neon-blue/10 rounded-full flex items-center justify-center mb-6 border border-neon-blue/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
              <MapPin className="w-10 h-10 text-neon-blue" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Find Nearby Facilities</h2>
            <p className="text-gray-400 mb-8 max-w-[280px]">Allow location access to find nearby hospitals and pharmacies.</p>
            
            <div className="w-full max-w-sm space-y-4">
              <button 
                onClick={handleAllowLocation}
                className="w-full bg-neon-blue text-[#050a1f] py-4 rounded-2xl font-bold text-lg hover:bg-neon-blue/90 transition-colors shadow-[0_0_15px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2"
              >
                <Crosshair className="w-5 h-5" /> Allow Location
              </button>
              <button 
                onClick={() => setLocationStatus('manual')}
                className="w-full bg-transparent border border-white/20 text-white py-4 rounded-2xl font-bold hover:bg-white/5 transition-colors"
              >
                Enter Location Manually
              </button>
            </div>
          </div>
        ) : locationStatus === 'manual' && hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-6 h-6 text-neon-purple" />
                <h2 className="text-xl font-bold text-white">Manual Entry</h2>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">City Name</label>
                  <input 
                    type="text" 
                    required
                    value={manualLocation.city}
                    onChange={e => setManualLocation({...manualLocation, city: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple text-white transition-colors"
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Area Name</label>
                  <input 
                    type="text" 
                    required
                    value={manualLocation.area}
                    onChange={e => setManualLocation({...manualLocation, area: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple text-white transition-colors"
                    placeholder="e.g. Bandra West"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Pincode</label>
                  <input 
                    type="text" 
                    required
                    value={manualLocation.pincode}
                    onChange={e => setManualLocation({...manualLocation, pincode: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple text-white transition-colors"
                    placeholder="e.g. 400050"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neon-purple text-white py-4 rounded-xl font-bold mt-4 hover:bg-neon-purple/90 transition-colors shadow-[0_0_15px_rgba(176,38,255,0.4)] disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search Hospitals'}
                </button>
              </form>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-neon-blue">
            <div className="w-10 h-10 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(0,243,255,0.5)]"></div>
            <p className="font-medium tracking-wide">Finding nearby facilities...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-10 text-gray-400 glass-panel rounded-3xl border border-white/5">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50 text-neon-blue" />
            <p>No hospitals found nearby.</p>
            <button 
              onClick={() => setLocationStatus('manual')}
              className="mt-4 text-neon-blue font-medium hover:underline"
            >
              Try entering location manually
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {hospitals.map((hospital, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-neon-blue/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg leading-tight pr-4 tracking-wide group-hover:text-neon-blue transition-colors">{hospital.name}</h3>
                  <div className="flex items-center gap-1 bg-[#ff8c00]/10 border border-[#ff8c00]/30 text-[#ff8c00] px-2 py-1 rounded-lg text-sm font-bold shrink-0 shadow-[0_0_8px_rgba(255,140,0,0.2)]">
                    <Star className="w-4 h-4 fill-current" />
                    {hospital.rating || '4.5'}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-neon-purple/20 text-neon-purple text-xs px-2 py-1 rounded-md border border-neon-purple/30 font-medium">
                    {hospital.type || 'Hospital'}
                  </span>
                  {hospital.distance && (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {hospital.distance}
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{hospital.address}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className={`w-4 h-4 ${hospital.emergency ? 'text-neon-pink' : 'text-gray-500'}`} />
                    <span className={hospital.emergency ? 'text-gray-200' : 'text-gray-500'}>
                      {hospital.emergency ? 'Emergency Available' : 'No Emergency'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="w-4 h-4 text-neon-blue" />
                    <span className="text-gray-200 truncate" title={hospital.doctors?.join(', ')}>
                      {hospital.doctors?.length ? hospital.doctors[0] + (hospital.doctors.length > 1 ? '...' : '') : 'Doctors Available'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <a 
                    href={hospital.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-neon-green/10 border border-neon-green/30 text-neon-green py-2.5 rounded-xl font-medium hover:bg-neon-green/20 transition-colors shadow-[0_0_10px_rgba(0,255,102,0.1)]"
                  >
                    <Navigation className="w-4 h-4" /> Directions
                  </a>
                  <button 
                    onClick={() => handleBookClick(hospital)}
                    className="flex-1 flex items-center justify-center gap-2 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue py-2.5 rounded-xl font-medium hover:bg-neon-blue/20 transition-colors shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                  >
                    <Calendar className="w-4 h-4" /> Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedHospital && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold neon-text-blue">Book Appointment</h3>
                <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-1">Hospital</p>
                <p className="font-medium text-white">{selectedHospital.name}</p>
              </div>

              <form onSubmit={handleBookSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Doctor</label>
                  <select 
                    required
                    value={bookingDetails.doctor}
                    onChange={(e) => setBookingDetails({...bookingDetails, doctor: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue transition-colors"
                  >
                    <option value="">Choose a specialist</option>
                    {selectedHospital.doctors?.map((doc: string, i: number) => (
                      <option key={i} value={doc}>{doc}</option>
                    ))}
                    {(!selectedHospital.doctors || selectedHospital.doctors.length === 0) && (
                      <option value="General Physician">General Physician</option>
                    )}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Date</label>
                    <input 
                      type="date" 
                      required
                      value={bookingDetails.date}
                      onChange={(e) => setBookingDetails({...bookingDetails, date: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Time</label>
                    <input 
                      type="time" 
                      required
                      value={bookingDetails.time}
                      onChange={(e) => setBookingDetails({...bookingDetails, time: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue transition-colors"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-neon-blue/10 border border-neon-blue text-neon-blue font-bold py-4 rounded-xl mt-4 hover:bg-neon-blue/20 transition-colors shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                >
                  Confirm Booking
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  );
}
