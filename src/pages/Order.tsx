import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import { ShoppingBag, Search, Plus, Minus, FileText, CreditCard, Package, Camera, Image as ImageIcon, FolderOpen, X, CheckCircle, Mic } from 'lucide-react';
import { extractMedicinesFromPrescription } from '../services/gemini';

export default function Order() {
  const [cart, setCart] = useState<{ id: string, name: string, price: number, qty: number }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Prescription Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [extractedMedicines, setExtractedMedicines] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'confirmation'>('cart');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  const medicinesList = [
    { id: '1', name: 'Paracetamol 500mg', price: 150, desc: 'Pain relief and fever reducer' },
    { id: '2', name: 'Amoxicillin 250mg', price: 349, desc: 'Antibiotic for bacterial infections' },
    { id: '3', name: 'Ibuprofen 400mg', price: 220, desc: 'Anti-inflammatory and pain relief' },
    { id: '4', name: 'Cetirizine 10mg', price: 120, desc: 'Allergy relief' },
    { id: '5', name: 'Vitamin C 1000mg', price: 450, desc: 'Immune system support' },
    { id: '6', name: 'Azithromycin 500mg', price: 550, desc: 'Antibiotic for respiratory infections' },
    { id: '7', name: 'Pantoprazole 500mg', price: 210, desc: 'Treats bacterial infections' },
    { id: '8', name: 'Aspirin 250mg', price: 85, desc: 'Pain relief and blood thinner' },
    { id: '9', name: 'Tramadol 50mg', price: 280, desc: 'Moderate to severe pain relief' },
    { id: '10', name: 'Metformin 500mg', price: 180, desc: 'Controls high blood sugar' },
    { id: '11', name: 'Atorvastatin 20mg', price: 320, desc: 'Lowers cholesterol levels' },
    { id: '12', name: 'Amlodipine 5mg', price: 140, desc: 'Treats high blood pressure' },
    { id: '13', name: 'Omeprazole 20mg', price: 190, desc: 'Reduces stomach acid' },
    { id: '14', name: 'Losartan 50mg', price: 260, desc: 'Treats high blood pressure' },
    { id: '15', name: 'Levothyroxine 50mcg', price: 150, desc: 'Treats hypothyroidism' },
    { id: '16', name: 'Albuterol Inhaler', price: 450, desc: 'Relieves asthma symptoms' },
    { id: '17', name: 'Gabapentin 300mg', price: 380, desc: 'Treats nerve pain and seizures' },
    { id: '18', name: 'Sertraline 50mg', price: 420, desc: 'Treats depression and anxiety' },
    { id: '19', name: 'Montelukast 10mg', price: 290, desc: 'Prevents asthma attacks' },
    { id: '20', name: 'Fluconazole 150mg', price: 110, desc: 'Treats fungal infections' },
    { id: '21', name: 'Dolo 650mg', price: 30, desc: 'Fever and pain relief' },
    { id: '22', name: 'Crocin Advance', price: 20, desc: 'Fast pain relief' },
    { id: '23', name: 'Digene Tablets', price: 25, desc: 'Acidity and gas relief' },
    { id: '24', name: 'Eno Fruit Salt', price: 10, desc: 'Fast acidity relief' },
    { id: '25', name: 'Vicks VapoRub', price: 85, desc: 'Cold and cough relief' },
    { id: '26', name: 'Volini Gel', price: 120, desc: 'Muscle and joint pain relief' },
    { id: '27', name: 'Betadine Ointment', price: 95, desc: 'Antiseptic for wounds' },
    { id: '28', name: 'Soframycin Cream', price: 65, desc: 'Antibacterial skin cream' },
    { id: '29', name: 'Pudin Hara Pearls', price: 45, desc: 'Stomach ache and gas relief' },
    { id: '30', name: 'Hajmola Tablets', price: 15, desc: 'Digestive aid' },
  ];

  useEffect(() => {
    if (!user) return;
    const storedOrders = localStorage.getItem(`orders_${user.uid}`);
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    }
  }, [user]);

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser.');
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
      setSearchQuery(transcript);
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

  const filteredMedicines = medicinesList.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    med.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (med: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === med.id);
      if (existing) {
        return prev.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...med, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCheckout = () => {
    if (!user || cart.length === 0) return;
    setCheckoutStep('payment');
  };

  const processPayment = () => {
    const newOrder = {
      id: Date.now().toString(),
      userId: user!.uid,
      items: cart.map(c => `${c.qty}x ${c.name}`),
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      type: 'manual',
      paymentMethod
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem(`orders_${user!.uid}`, JSON.stringify(updatedOrders));
    
    setConfirmedOrder(newOrder);
    setCart([]);
    setCheckoutStep('confirmation');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFile(file);
      setShowUploadModal(false);
      setIsExtracting(true);
      setExtractedMedicines([]);

      if (file.type.startsWith('image/')) {
        setPrescriptionPreview(URL.createObjectURL(file));
        
        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const medicines = await extractMedicinesFromPrescription(base64Data, file.type);
            setExtractedMedicines(medicines);
            setIsExtracting(false);
          };
        } catch (error) {
          console.error('Error extracting medicines:', error);
          setIsExtracting(false);
        }
      } else {
        setPrescriptionPreview('document');
        setIsExtracting(false);
      }
    }
  };

  const handlePrescriptionSubmit = () => {
    if (!user || !prescriptionFile) return;
    
    const newOrder = {
      id: Date.now().toString(),
      userId: user.uid,
      items: ['Prescription Order'],
      total: 0, // To be calculated by pharmacy
      status: 'pending',
      createdAt: new Date().toISOString(),
      type: 'prescription'
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem(`orders_${user.uid}`, JSON.stringify(updatedOrders));
    
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
    alert('Prescription submitted successfully! Our pharmacist will review it and update the price.');
  };

  const clearPrescription = () => {
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050a1f] h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-neon-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="px-6 pt-12 pb-4 z-10 sticky top-0 bg-[#050a1f]/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-wide neon-text-blue">Pharmacy</h1>
        <button 
          onClick={() => setShowCart(!showCart)}
          className="relative w-10 h-10 bg-neon-blue/10 text-neon-blue rounded-full flex items-center justify-center hover:bg-neon-blue/20 transition-colors border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]"
        >
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050a1f] shadow-[0_0_5px_rgba(239,68,68,0.5)]">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 relative z-10">
        {showCart ? (
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            {checkoutStep === 'cart' && (
              <>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white tracking-wide">Your Cart</h2>
                  <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-4">
                          <div>
                            <h3 className="font-bold text-white">{item.name}</h3>
                            <p className="text-neon-green font-medium">{formatCurrency(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-white/10">
                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold w-4 text-center text-white">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mb-6 text-lg font-bold border-t border-white/10 pt-4">
                      <span className="text-white">Total:</span>
                      <span className="text-neon-green drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]">{formatCurrency(total)}</span>
                    </div>
                    <button 
                      onClick={handleCheckout}
                      className="w-full bg-neon-blue/10 text-neon-blue py-4 rounded-xl font-bold hover:bg-neon-blue/20 transition-colors flex items-center justify-center gap-2 border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] tracking-wide"
                    >
                      <CreditCard className="w-5 h-5" /> Checkout
                    </button>
                  </>
                )}
              </>
            )}

            {checkoutStep === 'payment' && (
              <>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold text-white tracking-wide">Payment</h2>
                  <button onClick={() => setCheckoutStep('cart')} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="mb-6">
                  <p className="text-gray-400 mb-4">Select Payment Method for <span className="font-bold text-neon-green">{formatCurrency(total)}</span></p>
                  <div className="space-y-3">
                    {[
                      { id: 'upi', label: 'UPI (GPay, PhonePe, Paytm)' },
                      { id: 'card', label: 'Credit / Debit Card' },
                      { id: 'netbanking', label: 'Net Banking' },
                      { id: 'cod', label: 'Cash on Delivery' }
                    ].map(method => (
                      <label key={method.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === method.id ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'border-white/10 bg-black/40 hover:border-neon-blue/50'}`}>
                        <input 
                          type="radio" 
                          name="payment" 
                          value={method.id} 
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-neon-blue focus:ring-neon-blue bg-black border-white/30"
                        />
                        <span className="ml-3 font-medium text-white">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={processPayment}
                  className="w-full bg-neon-green/10 text-neon-green py-4 rounded-xl font-bold hover:bg-neon-green/20 transition-colors border border-neon-green shadow-[0_0_15px_rgba(0,255,102,0.3)] tracking-wide"
                >
                  Confirm Payment
                </button>
              </>
            )}

            {checkoutStep === 'confirmation' && confirmedOrder && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-neon-green/10 text-neon-green rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-green/30 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide" style={{ textShadow: '0 0 10px rgba(0,255,102,0.5)' }}>Order Confirmed!</h2>
                <p className="text-gray-400 mb-6">Your order #{confirmedOrder.id.slice(0, 8)} has been placed successfully.</p>
                
                <div className="bg-black/40 p-4 rounded-xl text-left mb-6 border border-white/10">
                  <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Estimated Delivery</p>
                  <p className="font-bold text-white mb-4">Today, by 8:00 PM</p>
                  
                  <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Total Amount</p>
                  <p className="font-bold text-neon-green text-lg drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]">{formatCurrency(confirmedOrder.total)}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setShowCart(false);
                    setCheckoutStep('cart');
                    setConfirmedOrder(null);
                  }}
                  className="w-full bg-neon-blue/10 text-neon-blue py-4 rounded-xl font-bold hover:bg-neon-blue/20 transition-colors border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)] tracking-wide"
                >
                  Track Order
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="relative mb-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search medicines..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 focus:border-neon-blue outline-none bg-black/40 text-white shadow-sm transition-colors"
                />
              </div>
              <button 
                onClick={handleVoiceSearch}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors border ${
                  isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-black/40 border-white/10 text-gray-400 hover:border-neon-blue/50 hover:text-neon-blue'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            {/* Prescription Upload Section */}
            {!prescriptionFile ? (
              <button 
                onClick={() => setShowUploadModal(true)}
                className="w-full bg-neon-blue/5 border border-neon-blue/20 rounded-2xl p-4 mb-6 flex items-center gap-4 hover:bg-neon-blue/10 transition-colors text-left shadow-[0_0_15px_rgba(0,243,255,0.1)]"
              >
                <div className="w-12 h-12 bg-neon-blue/10 rounded-full flex items-center justify-center shrink-0 border border-neon-blue/30">
                  <FileText className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-wide">Upload Prescription</h3>
                  <p className="text-sm text-gray-400">Get medicines delivered quickly</p>
                </div>
              </button>
            ) : (
              <div className="bg-neon-green/5 border border-neon-green/20 rounded-2xl p-4 mb-6 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-neon-green font-bold tracking-wide">
                    <CheckCircle className="w-5 h-5" />
                    Prescription uploaded successfully
                  </div>
                  <button onClick={clearPrescription} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {prescriptionPreview === 'document' ? (
                  <div className="bg-black/40 p-4 rounded-xl flex items-center gap-3 mb-4 border border-white/10">
                    <FileText className="w-8 h-8 text-neon-green" />
                    <span className="font-medium text-gray-300 truncate">{prescriptionFile.name}</span>
                  </div>
                ) : (
                  <div className="bg-black/40 p-2 rounded-xl mb-4 border border-white/10">
                    <img src={prescriptionPreview!} alt="Prescription preview" className="w-full h-32 object-cover rounded-lg opacity-80" />
                  </div>
                )}
                
                {isExtracting ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
                    <span className="ml-3 text-neon-green font-medium tracking-wide">Analyzing prescription...</span>
                  </div>
                ) : extractedMedicines.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="font-bold text-white mb-2 tracking-wide">Detected Medicines:</h4>
                    <ul className="space-y-2">
                      {extractedMedicines.map((medName, idx) => (
                        <li key={idx} className="bg-black/40 p-3 rounded-xl border border-white/10 flex justify-between items-center">
                          <span className="font-medium text-gray-300">{medName}</span>
                          <button 
                            onClick={() => {
                              const found = medicinesList.find(m => m.name.toLowerCase().includes(medName.toLowerCase()));
                              if (found) {
                                addToCart(found);
                              } else {
                                addToCart({ id: `ext-${idx}`, name: medName, price: 100, desc: 'Prescription medicine' });
                              }
                            }}
                            className="bg-neon-green/10 text-neon-green px-3 py-1 rounded-lg text-sm font-bold hover:bg-neon-green/20 transition-colors border border-neon-green/30"
                          >
                            Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                
                <button 
                  onClick={handlePrescriptionSubmit}
                  className="w-full bg-neon-green/10 text-neon-green py-3 rounded-xl font-bold hover:bg-neon-green/20 transition-colors border border-neon-green shadow-[0_0_15px_rgba(0,255,102,0.3)] tracking-wide"
                >
                  Proceed with Prescription
                </button>
              </div>
            )}

            <h2 className="text-lg font-bold text-white mb-4 tracking-wide neon-text-blue">
              {searchQuery ? 'Search Results' : 'Popular Medicines'}
            </h2>
            
            {filteredMedicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No medicines found matching "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {filteredMedicines.map(med => (
                  <div key={med.id} className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col h-full hover:border-neon-blue/30 transition-colors">
                    <h3 className="font-bold text-white leading-tight mb-1">{med.name}</h3>
                    <p className="text-xs text-gray-400 mb-3 flex-1">{med.desc}</p>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="font-bold text-neon-green drop-shadow-[0_0_5px_rgba(0,255,102,0.3)]">{formatCurrency(med.price)}</span>
                      <button 
                        onClick={() => addToCart(med)}
                        className="w-8 h-8 bg-neon-blue/10 rounded-full flex items-center justify-center hover:bg-neon-blue/20 text-neon-blue transition-colors border border-neon-blue/30"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {orders.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white mb-4 tracking-wide neon-text-blue">Your Orders</h2>
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order.id} className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-neon-blue/30 transition-colors">
                      <div className="w-10 h-10 bg-neon-orange/10 text-neon-orange rounded-full flex items-center justify-center shrink-0 border border-neon-orange/30" style={{ color: '#ff8c00', borderColor: 'rgba(255, 140, 0, 0.3)', backgroundColor: 'rgba(255, 140, 0, 0.1)' }}>
                        {order.type === 'prescription' ? <FileText className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">Order #{order.id.slice(0, 6)}</h3>
                        <p className="text-xs text-gray-400">
                          {order.type === 'prescription' ? 'Prescription Review' : `${order.items.length} items • ${formatCurrency(order.total)}`}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border ${
                        order.status === 'pending' ? 'bg-neon-orange/10 text-neon-orange border-neon-orange/30 shadow-[0_0_8px_rgba(255,140,0,0.2)]' : 
                        order.status === 'delivered' ? 'bg-neon-green/10 text-neon-green border-neon-green/30 shadow-[0_0_8px_rgba(0,255,102,0.2)]' : 
                        'bg-neon-blue/10 text-neon-blue border-neon-blue/30 shadow-[0_0_8px_rgba(0,243,255,0.2)]'
                      }`} style={order.status === 'pending' ? { color: '#ff8c00', borderColor: 'rgba(255, 140, 0, 0.3)', backgroundColor: 'rgba(255, 140, 0, 0.1)' } : {}}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="glass-panel rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.1)] border border-white/10 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/40">
              <h2 className="text-lg font-bold text-white tracking-wide">Upload Prescription</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 bg-[#050a1f]/90">
              {/* Hidden file inputs */}
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} onChange={handleFileUpload} />
              <input type="file" accept="image/*" className="hidden" ref={galleryRef} onChange={handleFileUpload} />
              <input type="file" accept=".pdf,image/*" className="hidden" ref={fileRef} onChange={handleFileUpload} />

              <button 
                onClick={() => cameraRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-black/40 hover:border-neon-green/50 hover:bg-neon-green/5 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-white/5 group-hover:bg-neon-green/10 rounded-full flex items-center justify-center text-gray-400 group-hover:text-neon-green transition-colors border border-transparent group-hover:border-neon-green/30">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-neon-green transition-colors">Capture using Camera</h3>
                  <p className="text-sm text-gray-500">Take a photo of your prescription</p>
                </div>
              </button>

              <button 
                onClick={() => galleryRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-black/40 hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-white/5 group-hover:bg-neon-blue/10 rounded-full flex items-center justify-center text-gray-400 group-hover:text-neon-blue transition-colors border border-transparent group-hover:border-neon-blue/30">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-neon-blue transition-colors">Upload from Gallery</h3>
                  <p className="text-sm text-gray-500">Select an image from your photos</p>
                </div>
              </button>

              <button 
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-black/40 hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-white/5 group-hover:bg-neon-purple/10 rounded-full flex items-center justify-center text-gray-400 group-hover:text-neon-purple transition-colors border border-transparent group-hover:border-neon-purple/30">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-neon-purple transition-colors">Upload from File Manager</h3>
                  <p className="text-sm text-gray-500">Select a PDF or document</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  );
}
