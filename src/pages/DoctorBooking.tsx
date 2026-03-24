import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Star, Calendar, Clock, CheckCircle, Search, Navigation, User, Phone, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  clinic: string;
  distance: string;
  rating: number;
  reviews: number;
  experience: string;
  fee: string;
  image: string;
  lat: number;
  lng: number;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Rajesh Sharma',
    specialization: 'Cardiologist',
    clinic: 'City Heart Center',
    distance: '2.5 km',
    rating: 4.8,
    reviews: 124,
    experience: '15 Years',
    fee: '₹800',
    image: 'https://picsum.photos/seed/doctor1/200/200',
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: '2',
    name: 'Dr. Priya Patel',
    specialization: 'Dentist',
    clinic: 'Smile Dental Clinic',
    distance: '1.2 km',
    rating: 4.9,
    reviews: 89,
    experience: '8 Years',
    fee: '₹500',
    image: 'https://picsum.photos/seed/doctor2/200/200',
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: '3',
    name: 'Dr. Anil Kumar',
    specialization: 'General Physician',
    clinic: 'Health First Hospital',
    distance: '3.8 km',
    rating: 4.6,
    reviews: 210,
    experience: '20 Years',
    fee: '₹600',
    image: 'https://picsum.photos/seed/doctor3/200/200',
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: '4',
    name: 'Dr. Sneha Desai',
    specialization: 'Dermatologist',
    clinic: 'Skin Care Clinic',
    distance: '4.1 km',
    rating: 4.7,
    reviews: 156,
    experience: '12 Years',
    fee: '₹1000',
    image: 'https://picsum.photos/seed/doctor4/200/200',
    lat: 19.0760,
    lng: 72.8777
  }
];

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'];

export default function DoctorBooking() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'profile' | 'booking' | 'success' | 'history'>('list');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Booking State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const savedAppointments = localStorage.getItem(`appointments_${user?.uid}`);
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, [user]);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationGranted(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Location access denied. Showing default doctors.");
          setLocationGranted(true); // Proceed anyway with mock data
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLocationGranted(true);
    }
  };

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: selectedDate,
      time: selectedTime,
      status: 'upcoming'
    };

    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    localStorage.setItem(`appointments_${user?.uid}`, JSON.stringify(updatedAppointments));
    
    setView('success');
  };

  const filteredDoctors = MOCK_DOCTORS.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render Views ---

  const renderLocationPrompt = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#050a1f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-24 h-24 bg-neon-blue/10 rounded-full flex items-center justify-center mb-6 border border-neon-blue/30 shadow-[0_0_15px_rgba(0,243,255,0.2)] z-10">
        <MapPin className="w-12 h-12 text-neon-blue" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4 neon-text-blue z-10">Find Nearby Doctors</h2>
      <p className="text-gray-400 mb-8 max-w-xs z-10">
        Please allow location access to find the best doctors, clinics, and hospitals near you.
      </p>
      <button 
        onClick={requestLocation}
        className="w-full max-w-xs bg-neon-blue/10 text-neon-blue font-bold py-4 rounded-xl hover:bg-neon-blue/20 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2 z-10"
      >
        <Navigation className="w-5 h-5" /> Enable Location
      </button>
    </div>
  );

  const renderList = () => (
    <div className="flex-1 flex flex-col bg-[#050a1f] pb-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-4 py-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
              <ChevronLeft className="w-6 h-6 text-white" />
            </Link>
            <h1 className="text-xl font-bold text-white neon-text-blue">Book Appointment</h1>
          </div>
          <button 
            onClick={() => setView('history')}
            className="text-sm font-bold text-neon-blue bg-neon-blue/10 px-4 py-2 rounded-full hover:bg-neon-blue/20 transition-colors border border-neon-blue/30"
          >
            My Bookings
          </button>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search doctors, specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-neon-blue text-white transition-all"
          />
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto z-10">
        <h2 className="font-bold text-white mb-2 tracking-wide">Nearby Doctors</h2>
        {filteredDoctors.map(doctor => (
          <motion.div 
            key={doctor.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setSelectedDoctor(doctor); setView('profile'); }}
            className="glass-panel rounded-2xl p-4 shadow-sm border border-white/10 flex gap-4 cursor-pointer hover:border-neon-blue/30 transition-colors group"
          >
            <img src={doctor.image} alt={doctor.name} className="w-20 h-20 rounded-xl object-cover border border-white/10" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate text-lg tracking-wide">{doctor.name}</h3>
              <p className="text-sm text-neon-blue font-medium">{doctor.specialization}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{doctor.clinic}</p>
              
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs font-medium text-neon-orange bg-neon-orange/10 border border-neon-orange/30 px-2 py-1 rounded-md" style={{ color: '#ff8c00', borderColor: 'rgba(255, 140, 0, 0.3)', backgroundColor: 'rgba(255, 140, 0, 0.1)' }}>
                  <Star className="w-3 h-3 fill-current" /> {doctor.rating}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                  <MapPin className="w-3 h-3 text-neon-blue" /> {doctor.distance}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredDoctors.length === 0 && (
          <div className="text-center py-16 text-gray-500 glass-panel rounded-3xl border border-white/5">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50 text-neon-blue" />
            <p className="text-lg">No doctors found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => {
    if (!selectedDoctor) return null;
    return (
      <div className="flex-1 flex flex-col bg-[#050a1f] pb-24 overflow-y-auto relative">
        <div className="relative h-72 bg-black">
          <img src={selectedDoctor.image} alt={selectedDoctor.name} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050a1f] via-[#050a1f]/50 to-transparent"></div>
          
          <button onClick={() => setView('list')} className="absolute top-4 left-4 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10 z-20">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-8 left-6 right-6 text-white z-20">
            <h1 className="text-3xl font-bold mb-1 tracking-wide">{selectedDoctor.name}</h1>
            <p className="text-neon-blue font-medium text-lg">{selectedDoctor.specialization}</p>
          </div>
        </div>

        <div className="p-6 -mt-6 glass-panel rounded-t-3xl relative z-20 shadow-lg space-y-6 border-t border-white/10 mx-2">
          <div className="flex justify-between items-center pb-6 border-b border-white/10">
            <div className="text-center">
              <div className="w-12 h-12 bg-neon-blue/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                <User className="w-6 h-6 text-neon-blue" />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Experience</p>
              <p className="font-bold text-white text-lg">{selectedDoctor.experience}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-neon-orange/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-neon-orange/30 shadow-[0_0_10px_rgba(255,140,0,0.2)]" style={{ borderColor: 'rgba(255, 140, 0, 0.3)', backgroundColor: 'rgba(255, 140, 0, 0.1)' }}>
                <Star className="w-6 h-6 fill-current" style={{ color: '#ff8c00' }} />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Rating</p>
              <p className="font-bold text-white text-lg">{selectedDoctor.rating} <span className="text-gray-500 font-normal text-sm">({selectedDoctor.reviews})</span></p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-neon-green/30 shadow-[0_0_10px_rgba(0,255,102,0.2)]">
                <span className="font-bold text-neon-green text-xl">₹</span>
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Consultation</p>
              <p className="font-bold text-white text-lg">{selectedDoctor.fee}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-3 text-lg tracking-wide">About Doctor</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {selectedDoctor.name} is a highly experienced {selectedDoctor.specialization.toLowerCase()} at {selectedDoctor.clinic}. 
              Known for compassionate care and accurate diagnosis, ensuring the best treatment for all patients.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white mb-3 text-lg tracking-wide">Clinic Location</h3>
            <div className="bg-black/40 rounded-2xl p-4 border border-white/10 flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <MapPin className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">{selectedDoctor.clinic}</p>
                <p className="text-sm text-gray-400 mt-1">123 Health Avenue, Medical District, City Center.</p>
                <p className="text-xs font-medium text-neon-blue mt-2 flex items-center gap-1"><Navigation className="w-3 h-3" /> {selectedDoctor.distance} away</p>
              </div>
            </div>
            {/* Mock Map Image */}
            <div className="w-full h-32 bg-gray-900 rounded-2xl mt-4 overflow-hidden relative border border-white/10">
              <img src={`https://static-maps.yandex.ru/1.x/?ll=${selectedDoctor.lng},${selectedDoctor.lat}&size=400,200&z=14&l=map&pt=${selectedDoctor.lng},${selectedDoctor.lat},pm2rdm`} alt="Map" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-neon-blue/10 mix-blend-overlay"></div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('booking')}
            className="w-full bg-neon-blue/10 text-neon-blue font-bold py-4 rounded-xl hover:bg-neon-blue/20 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] text-lg tracking-wide mt-4"
          >
            Book Appointment
          </motion.button>
        </div>
      </div>
    );
  };

  const renderBooking = () => {
    if (!selectedDoctor) return null;
    return (
      <div className="flex-1 flex flex-col bg-[#050a1f] pb-24 overflow-y-auto relative">
        {/* Background Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="px-4 py-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex items-center gap-3">
          <button onClick={() => setView('profile')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white neon-text-blue">Select Time</h1>
        </div>

        <div className="p-6 space-y-8 z-10">
          <div className="glass-panel p-4 rounded-2xl shadow-sm border border-white/10 flex gap-4 items-center">
            <img src={selectedDoctor.image} alt={selectedDoctor.name} className="w-16 h-16 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
            <div>
              <h3 className="font-bold text-white text-lg tracking-wide">{selectedDoctor.name}</h3>
              <p className="text-sm text-neon-blue">{selectedDoctor.specialization}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 tracking-wide"><Calendar className="w-5 h-5 text-neon-blue" /> Select Date</h3>
            <input 
              type="date" 
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-4 rounded-xl border border-white/10 focus:border-neon-blue outline-none bg-black/40 font-medium text-white transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 tracking-wide"><Clock className="w-5 h-5 text-neon-blue" /> Available Slots</h3>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map(time => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border ${selectedTime === time ? 'bg-neon-blue/20 text-neon-blue border-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'bg-black/40 text-gray-400 border-white/10 hover:border-neon-blue/50 hover:text-white'}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime}
              className="w-full bg-neon-blue/10 text-neon-blue font-bold py-4 rounded-xl hover:bg-neon-blue/20 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:shadow-none disabled:border-white/10 disabled:text-gray-500 disabled:bg-black/40 text-lg tracking-wide"
            >
              Confirm Booking
            </motion.button>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccess = () => {
    if (!selectedDoctor) return null;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#050a1f] pb-24 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/10 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-neon-green/10 rounded-full flex items-center justify-center mb-6 border border-neon-green/30 shadow-[0_0_20px_rgba(0,255,102,0.3)] z-10"
        >
          <CheckCircle className="w-12 h-12 text-neon-green" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight z-10" style={{ textShadow: '0 0 10px rgba(0,255,102,0.5)' }}>Booking Confirmed!</h2>
        <p className="text-gray-300 mb-8 max-w-sm leading-relaxed z-10">
          Your appointment with <span className="font-bold text-white">{selectedDoctor.name}</span> has been successfully booked for <span className="font-bold text-neon-green">{new Date(selectedDate).toLocaleDateString()}</span> at <span className="font-bold text-neon-green">{selectedTime}</span>.
        </p>
        
        <div className="w-full max-w-sm glass-panel rounded-2xl p-5 border border-white/10 mb-8 text-left z-10">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Clinic Address</p>
          <p className="font-bold text-white text-lg">{selectedDoctor.clinic}</p>
          <p className="text-sm text-gray-400 mt-1">123 Health Avenue, Medical District.</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('history')}
          className="w-full max-w-sm bg-neon-blue/10 text-neon-blue font-bold py-4 rounded-xl hover:bg-neon-blue/20 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] text-lg tracking-wide z-10"
        >
          View My Bookings
        </motion.button>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="flex-1 flex flex-col bg-[#050a1f] pb-24 overflow-y-auto relative">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-4 py-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex items-center gap-3">
        <button onClick={() => setView('list')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white neon-text-blue">My Bookings</h1>
      </div>

      <div className="p-4 space-y-4 z-10">
        {appointments.length === 0 ? (
          <div className="text-center py-16 text-gray-500 glass-panel rounded-3xl border border-white/5">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50 text-neon-blue" />
            <p className="text-lg">You have no upcoming appointments.</p>
          </div>
        ) : (
          appointments.map(apt => (
            <div key={apt.id} className="glass-panel rounded-2xl p-5 shadow-sm border border-white/10 hover:border-neon-blue/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg tracking-wide">{apt.doctorName}</h3>
                  <p className="text-sm text-gray-400 mt-1">Appointment</p>
                </div>
                <span className="bg-neon-green/10 text-neon-green border border-neon-green/30 text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-[0_0_8px_rgba(0,255,102,0.2)]">
                  {apt.status}
                </span>
              </div>
              <div className="flex gap-4 text-sm font-medium text-white bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neon-blue" /> {new Date(apt.date).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-neon-blue" /> {apt.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050a1f] relative">
      {!locationGranted ? renderLocationPrompt() : (
        <>
          {view === 'list' && renderList()}
          {view === 'profile' && renderProfile()}
          {view === 'booking' && renderBooking()}
          {view === 'success' && renderSuccess()}
          {view === 'history' && renderHistory()}
        </>
      )}
      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  );
}
