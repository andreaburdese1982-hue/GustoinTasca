
import React, { useState } from 'react';
import { Home, PlusCircle, Map, User, LogOut, Sparkles, X, Loader2, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { askAiConcierge } from '../services/geminiService';
import CookieConsent from './CookieConsent';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();

  // --- AI CONCIERGE STATE ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const handleAiAsk = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiQuery.trim()) return;

      setIsAiThinking(true);
      setAiResponse('');
      
      try {
          // Fetch context data fresh from storage when needed
          const currentUser = await storageService.getCurrentUser();
          if (currentUser) {
              const cards = await storageService.getCards(currentUser.id, 'mine');
              const response = await askAiConcierge(aiQuery, cards);
              setAiResponse(response);
          } else {
              setAiResponse("Errore utente non identificato.");
          }
      } catch (e) {
          setAiResponse("Errore nel contattare l'IA.");
      } finally {
          setIsAiThinking(false);
      }
  };

  const NavItem = ({ to, icon: Icon, label, onClick }: { to?: string, icon: any, label: string, onClick?: () => void }) => {
    const isActive = to ? location.pathname === to : false;
    
    const content = (
      <div className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-500'}`}>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
    );

    if (onClick) {
        return <button onClick={onClick} className="w-full h-full">{content}</button>;
    }
    return <Link to={to!} className="w-full h-full flex justify-center">{content}</Link>;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">GT</div>
          <h1 className="text-lg font-bold text-gray-800">GustoinTasca</h1>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-red-500">
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {children}
      </main>

      {/* Cookie Consent Banner (Global) */}
      <CookieConsent />

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full h-20 bg-white border-t border-gray-200 px-2 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end h-full pb-4">
            {/* Left Group */}
            <div className="flex-1 flex justify-around">
                <NavItem to="/" icon={Home} label="Home" />
                <NavItem to="/map" icon={Map} label="Mappa" />
            </div>

            {/* Center Button (Add) */}
            <div className="relative -top-6 mx-2">
                <Link to="/add" className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-emerald-600 transition-transform transform hover:scale-105 border-4 border-gray-50">
                    <PlusCircle size={36} />
                </Link>
            </div>

            {/* Right Group */}
            <div className="flex-1 flex justify-around">
                <NavItem onClick={() => setShowAiModal(true)} icon={Sparkles} label="Concierge" />
                <NavItem to="/profile" icon={User} label="Profilo" />
            </div>
        </div>
      </nav>

      {/* AI CONCIERGE MODAL (Global) */}
      {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex justify-between items-center text-white">
                      <div className="flex items-center space-x-2">
                          <Sparkles size={20} className="text-yellow-200" />
                          <h3 className="font-bold text-lg">Gusto Assistant</h3>
                      </div>
                      <button onClick={() => setShowAiModal(false)} className="text-white/80 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Chat Area */}
                  <div className="p-4 flex-1 overflow-y-auto bg-gray-50 min-h-[200px]">
                      {aiResponse ? (
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 text-gray-700 leading-relaxed text-sm">
                              {/* Simple rendering for bold text */}
                              {aiResponse.split('**').map((part, i) => 
                                  i % 2 === 1 ? <strong key={i} className="text-indigo-600">{part}</strong> : part
                              )}
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3 py-8">
                              <Sparkles size={48} className="text-indigo-100" />
                              <p className="text-sm">Chiedimi un consiglio basato sui tuoi luoghi salvati.</p>
                              <div className="flex flex-wrap gap-2 justify-center mt-2">
                                  <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full">"Posto economico?"</span>
                                  <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full">"Hotel con palestra?"</span>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleAiAsk} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
                      <input 
                          type="text" 
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          placeholder="Fai una domanda..." 
                          className="flex-1 p-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          disabled={isAiThinking}
                      />
                      <button 
                          type="submit" 
                          disabled={isAiThinking || !aiQuery.trim()}
                          className="p-3 bg-indigo-600 text-white rounded-xl shadow-md disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                      >
                          {isAiThinking ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Layout;
