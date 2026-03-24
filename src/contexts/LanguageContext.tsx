import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'HealthCare Companion',
    'app.tagline': 'Your Smart Health Assistant',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgot': 'Forgot Password?',
    'auth.google': 'Continue with Google',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.hasAccount': 'Already have an account?',
    'auth.name': 'Full Name',
    'auth.mobile': 'Mobile Number',
    'auth.confirmPassword': 'Confirm Password',
    'lang.select': 'Select Language',
    'loc.allow': 'Allow Location Access',
    'loc.manual': 'Enter Location Manually',
    'loc.desc': 'Allow location access to find nearby hospitals and pharmacies',
    'home.medicine': 'Medicine Reminder',
    'home.health': 'Health Tracker',
    'home.hospitals': 'Nearby Hospitals',
    'home.order': 'Order Medicines',
    'home.tips': 'Health Tips',
    'home.chatbot': 'Mental Health AI',
    'home.fitness': 'Fitness Coaching',
    'home.lung': 'Lung Test',
    'home.therapy': 'Therapy & Reports',
    'home.doctor': 'Doctor Booking',
    'home.greeting.morning': 'Good Morning',
    'home.greeting.afternoon': 'Good Afternoon',
    'home.greeting.evening': 'Good Evening',
    'home.greeting.night': 'Good Night',
    'settings.title': 'Settings',
    'settings.history': 'Medical Reminder History',
    'settings.notifications': 'Notification Settings',
    'settings.language': 'Language Settings',
    'settings.emergency': 'Emergency Contacts',
    'settings.privacy': 'Privacy & Security',
    'settings.caregiver': 'Caregiver Mode',
    'settings.help': 'Help & Support (AI)',
    'settings.about': 'About Application',
    'settings.logout': 'Log Out',
    'nav.home': 'Home',
    'nav.health': 'Health',
    'nav.meds': 'Meds',
    'nav.chat': 'AI Chat',
    'nav.profile': 'Profile',
  },
  hi: {
    'app.title': 'हेल्थकेयर कंपेनियन',
    'app.tagline': 'आपका स्मार्ट स्वास्थ्य सहायक',
    'auth.login': 'लॉग इन करें',
    'auth.signup': 'साइन अप करें',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.forgot': 'पासवर्ड भूल गए?',
    'auth.google': 'Google के साथ जारी रखें',
    'auth.noAccount': 'क्या आपके पास खाता नहीं है?',
    'auth.hasAccount': 'क्या आपके पास पहले से खाता है?',
    'auth.name': 'पूरा नाम',
    'auth.mobile': 'मोबाइल नंबर',
    'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'lang.select': 'भाषा चुनें',
    'loc.allow': 'स्थान पहुंच की अनुमति दें',
    'loc.manual': 'मैन्युअल रूप से स्थान दर्ज करें',
    'loc.desc': 'आस-पास के अस्पतालों और फार्मेसियों को खोजने के लिए स्थान पहुंच की अनुमति दें',
    'home.medicine': 'दवा अनुस्मारक',
    'home.health': 'स्वास्थ्य ट्रैकर',
    'home.hospitals': 'आस-पास के अस्पताल',
    'home.order': 'दवाएं ऑर्डर करें',
    'home.tips': 'स्वास्थ्य युक्तियाँ',
    'home.chatbot': 'मानसिक स्वास्थ्य एआई',
    'home.fitness': 'फिटनेस कोचिंग',
    'home.lung': 'फेफड़ों का परीक्षण',
    'home.therapy': 'थेरेपी और रिपोर्ट',
    'home.doctor': 'डॉक्टर बुकिंग',
    'home.greeting.morning': 'सुप्रभात',
    'home.greeting.afternoon': 'नमस्कार',
    'home.greeting.evening': 'शुभ संध्या',
    'home.greeting.night': 'शुभ रात्रि',
    'settings.title': 'सेटिंग्स',
    'settings.history': 'दवा अनुस्मारक इतिहास',
    'settings.notifications': 'अधिसूचना सेटिंग्स',
    'settings.language': 'भाषा सेटिंग्स',
    'settings.emergency': 'आपातकालीन संपर्क',
    'settings.privacy': 'गोपनीयता और सुरक्षा',
    'settings.caregiver': 'देखभालकर्ता मोड',
    'settings.help': 'सहायता और समर्थन (एआई)',
    'settings.about': 'एप्लिकेशन के बारे में',
    'settings.logout': 'लॉग आउट',
    'nav.home': 'होम',
    'nav.health': 'स्वास्थ्य',
    'nav.meds': 'दवाएं',
    'nav.chat': 'एआई चैट',
    'nav.profile': 'प्रोफ़ाइल',
  },
  mr: {
    'app.title': 'हेल्थकेअर कंपेनियन',
    'app.tagline': 'तुमचा स्मार्ट आरोग्य सहाय्यक',
    'auth.login': 'लॉगिन करा',
    'auth.signup': 'साइन अप करा',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.forgot': 'पासवर्ड विसरलात?',
    'auth.google': 'Google सह सुरू ठेवा',
    'auth.noAccount': 'खाते नाही?',
    'auth.hasAccount': 'आधीच खाते आहे?',
    'auth.name': 'पूर्ण नाव',
    'auth.mobile': 'मोबाईल नंबर',
    'auth.confirmPassword': 'पासवर्डची पुष्टी करा',
    'lang.select': 'भाषा निवडा',
    'loc.allow': 'स्थान प्रवेशास अनुमती द्या',
    'loc.manual': 'स्थान व्यक्तिचलितपणे प्रविष्ट करा',
    'loc.desc': 'जवळपासची रुग्णालये आणि फार्मसी शोधण्यासाठी स्थान प्रवेशास अनुमती द्या',
    'home.medicine': 'औषध स्मरणपत्र',
    'home.health': 'आरोग्य ट्रॅकर',
    'home.hospitals': 'जवळपासची रुग्णालये',
    'home.order': 'औषधे ऑर्डर करा',
    'home.tips': 'आरोग्य टिप्स',
    'home.chatbot': 'मानसिक आरोग्य एआय',
    'home.fitness': 'फिटनेस कोचिंग',
    'home.lung': 'फुफ्फुसांची चाचणी',
    'home.therapy': 'थेरपी आणि अहवाल',
    'home.doctor': 'डॉक्टर बुकिंग',
    'home.greeting.morning': 'शुभ सकाळ',
    'home.greeting.afternoon': 'शुभ दुपार',
    'home.greeting.evening': 'शुभ संध्याकाळ',
    'home.greeting.night': 'शुभ रात्री',
    'settings.title': 'सेटिंग्ज',
    'settings.history': 'औषध स्मरणपत्र इतिहास',
    'settings.notifications': 'सूचना सेटिंग्ज',
    'settings.language': 'भाषा सेटिंग्ज',
    'settings.emergency': 'आणीबाणी संपर्क',
    'settings.privacy': 'गोपनीयता आणि सुरक्षा',
    'settings.caregiver': 'काळजीवाहू मोड',
    'settings.help': 'मदत आणि समर्थन (एआय)',
    'settings.about': 'अर्जाबद्दल',
    'settings.logout': 'लॉग आउट',
    'nav.home': 'मुख्यपृष्ठ',
    'nav.health': 'आरोग्य',
    'nav.meds': 'औषधे',
    'nav.chat': 'एआय चॅट',
    'nav.profile': 'प्रोफाइल',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
