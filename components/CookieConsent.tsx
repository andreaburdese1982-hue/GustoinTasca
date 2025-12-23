
import React, { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gustointasca_cookie_consent');
    if (!consent) {
      // Small delay for better UX animation
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gustointasca_cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-gray-900/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-gray-700 text-white flex flex-col shadow-black/20">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Cookie size={20} />
                <span>Privacy & Cookie</span>
            </div>
            {/* Optional close without explicit accept (still allows nav) */}
            <button onClick={() => setShow(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
            </button>
        </div>
        
        <p className="text-xs text-gray-300 leading-relaxed mb-4">
          Utilizziamo cookie tecnici e salvataggio locale per garantirti la migliore esperienza (login, mappa, preferenze). 
          Continuando a navigare accetti la nostra <Link to="/privacy" className="underline text-emerald-400 hover:text-emerald-300">Privacy Policy</Link>.
        </p>

        <button 
            onClick={handleAccept}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg"
        >
            Ho capito, prosegui
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
