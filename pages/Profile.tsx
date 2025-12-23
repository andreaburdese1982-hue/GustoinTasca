
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { User as UserIcon, Mail, Loader2, Map, RefreshCw, TrendingUp, Wallet, Trophy, Tag, Lock, ShieldCheck, ChevronRight } from 'lucide-react';
import { User, BusinessCard, PlaceType } from '../types';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFixing, setIsFixing] = useState(false);
  const [fixStatus, setFixStatus] = useState<string | null>(null);
  
  // PASSWORD STATE
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passStatus, setPassStatus] = useState<{msg: string, isError: boolean} | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        const currentUser = await storageService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            const userCards = await storageService.getCards(currentUser.id, 'mine');
            setCards(userCards);
        }
        setIsLoading(false);
    };
    loadData();
  }, []);

  const fetchCoordinates = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates;
            return { lat: coords[1], lng: coords[0] };
        }
    } catch (e) {
        console.warn("Photon geocoding failed", e);
    }
    return null;
  };

  const handleFixMap = async () => {
      if (!user) return;
      setIsFixing(true);
      setFixStatus("Analisi dei biglietti in corso...");
      
      try {
          // Refetch to be sure
          const currentCards = await storageService.getCards(user.id);
          let fixedCount = 0;
          let failCount = 0;

          for (const card of currentCards) {
              // If card has address but NO coordinates
              if (card.address && (!card.lat || !card.lng)) {
                  setFixStatus(`Aggiorno: ${card.name}...`);
                  const coords = await fetchCoordinates(card.address);
                  if (coords) {
                      card.lat = coords.lat;
                      card.lng = coords.lng;
                      await storageService.saveCard(card);
                      fixedCount++;
                  } else {
                      failCount++;
                  }
                  // Small delay to be polite to the API
                  await new Promise(r => setTimeout(r, 600)); 
              }
          }

          setFixStatus(`Completato! ${fixedCount} biglietti aggiornati. ${failCount > 0 ? `(${failCount} indirizzi non trovati)` : ''}`);
      } catch (e) {
          console.error(e);
          setFixStatus("Errore durante l'aggiornamento.");
      } finally {
          setIsFixing(false);
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword.length < 6) {
          setPassStatus({msg: 'La password deve essere di almeno 6 caratteri.', isError: true});
          return;
      }
      if (newPassword !== confirmPassword) {
          setPassStatus({msg: 'Le password non coincidono.', isError: true});
          return;
      }

      setIsUpdatingPass(true);
      setPassStatus(null);

      try {
          await storageService.updatePassword(newPassword);
          setPassStatus({msg: 'Password aggiornata con successo!', isError: false});
          setNewPassword('');
          setConfirmPassword('');
      } catch (err: any) {
          setPassStatus({msg: err.message || "Errore durante l'aggiornamento.", isError: true});
      } finally {
          setIsUpdatingPass(false);
      }
  };

  // --- STATS CALCULATION ---
  const calculateStats = () => {
      const totalCards = cards.length;
      
      // Total Estimated Budget
      const totalSpent = cards.reduce((acc, curr) => acc + (curr.averageCost || 0), 0);
      
      // Favorite Type
      const typeCounts = cards.reduce((acc, curr) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      const favType = Object.entries(typeCounts).sort((a,b) => (b[1] as number) - (a[1] as number))[0];

      // Top Tag
      const tagCounts: Record<string, number> = {};
      cards.forEach(c => {
          c.tags.forEach(t => {
              const cleanTag = t.trim().toLowerCase();
              tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          });
      });
      const topTag = Object.entries(tagCounts).sort((a,b) => (b[1] as number) - (a[1] as number))[0];

      return {
          totalCards,
          totalSpent,
          favType: favType ? favType[0] : '-',
          topTag: topTag ? topTag[0] : '-'
      };
  };

  const stats = calculateStats();

  if (isLoading) {
      return (
          <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
      );
  }

  if (!user) return null;

  return (
    <div className="p-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Il mio profilo</h2>
        
        {/* User Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-50 mb-4">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
            <span className="text-gray-500 text-sm">{user.email}</span>
        </div>

        {/* --- STATS SECTION --- */}
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <TrendingUp size={20} className="mr-2 text-emerald-600"/> 
            Il Tuo Passaporto
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="mb-2 p-2 bg-emerald-50 text-emerald-600 rounded-full">
                    <Map size={20} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{stats.totalCards}</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Luoghi Visitati</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="mb-2 p-2 bg-orange-50 text-orange-600 rounded-full">
                    <Wallet size={20} />
                </div>
                <span className="text-2xl font-bold text-gray-800">{stats.totalSpent}€</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Budget Stimato</span>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="mb-2 p-2 bg-blue-50 text-blue-600 rounded-full">
                    <Trophy size={20} />
                </div>
                <span className="text-lg font-bold text-gray-800 truncate max-w-full px-2">{stats.favType}</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Categoria Top</span>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="mb-2 p-2 bg-purple-50 text-purple-600 rounded-full">
                    <Tag size={20} />
                </div>
                <span className="text-lg font-bold text-gray-800 capitalize truncate max-w-full px-2">{stats.topTag}</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Tag Preferito</span>
            </div>
        </div>

        {/* Tools Section */}
        <h3 className="text-lg font-bold text-gray-800 mb-3">Strumenti</h3>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-start space-x-4">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg mt-1">
                    <RefreshCw size={24} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Rigenera Mappa</h4>
                    <p className="text-sm text-gray-500 mb-3">
                        Hai biglietti vecchi che non compaiono sulla mappa? Usa questo strumento per ricalcolare la posizione GPS.
                    </p>
                    
                    {fixStatus && (
                        <div className={`text-xs p-2 rounded mb-3 ${fixStatus.includes('Errore') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {fixStatus}
                        </div>
                    )}

                    <button 
                        onClick={handleFixMap} 
                        disabled={isFixing}
                        className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 flex items-center justify-center space-x-2 disabled:opacity-70"
                    >
                        {isFixing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        <span>{isFixing ? 'Elaborazione in corso...' : 'Aggiorna Coordinate'}</span>
                    </button>
                </div>
            </div>
        </div>

        {/* --- SECURITY SECTION --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <Lock size={20} className="mr-2 text-emerald-600"/> 
                Sicurezza
            </h3>
            
            <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nuova Password</label>
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                        placeholder="Minimo 6 caratteri"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Conferma Password</label>
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                        placeholder="Ripeti password"
                    />
                </div>

                {passStatus && (
                    <div className={`text-xs p-2 rounded ${passStatus.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {passStatus.msg}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isUpdatingPass || !newPassword || !confirmPassword}
                    className="w-full py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                    {isUpdatingPass ? <Loader2 className="animate-spin" size={16} /> : 'Aggiorna Password'}
                </button>
            </form>
        </div>

        {/* --- PRIVACY & LEGAL SECTION (NEW) --- */}
        <div className="mt-6">
            <Link to="/privacy" className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                        <ShieldCheck size={20} />
                    </div>
                    <span className="font-bold text-gray-700">Privacy & Cookie Policy</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
            </Link>
        </div>

        <div className="mt-8 text-center pb-8">
            <p className="text-xs text-gray-400">Versione App 1.5.0</p>
        </div>
    </div>
  );
};

export default Profile;
