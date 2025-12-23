

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Loader2, Pencil, Trash2, Check, Users, User as UserIcon, AlertTriangle, Heart, Import, Utensils, Bed, Ticket } from 'lucide-react';
import { storageService } from '../services/storageService';
import { BusinessCard, PlaceType, User } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<BusinessCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<PlaceType | 'All'>('All');
  const [viewMode, setViewMode] = useState<'mine' | 'community'>('mine');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // State for delete confirmation logic
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // State for import confirmation
  const [importingId, setImportingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
        const currentUser = await storageService.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const data = await storageService.getCards(currentUser.id, viewMode);
          setCards(data);
          setFilteredCards(data);
        }
    } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setFetchError("Impossibile caricare i dati. Controlla la tua connessione.");
    } finally {
        setIsLoading(false);
    }
  };

  // Re-fetch when view mode changes
  useEffect(() => {
    fetchData();
  }, [viewMode]);

  useEffect(() => {
    let result = cards;

    // Filter by Type
    if (activeFilter !== 'All') {
      result = result.filter(card => card.type === activeFilter);
    }

    // Filter by Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(card => 
        card.name.toLowerCase().includes(lowerTerm) || 
        card.address.toLowerCase().includes(lowerTerm) ||
        card.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
      );
    }

    setFilteredCards(result);
  }, [searchTerm, activeFilter, cards]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation to detail
    e.stopPropagation();

    if (deleteConfirmId === id) {
        // Confirmed
        try {
            await storageService.deleteCard(id);
            const newCards = cards.filter(c => c.id !== id);
            setCards(newCards);
            setDeleteConfirmId(null);
        } catch (err) {
            alert("Errore durante l'eliminazione.");
        }
    } else {
        // First click - ask for confirmation
        setDeleteConfirmId(id);
        // Auto-reset confirmation after 3 seconds
        setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleLike = async (e: React.MouseEvent, card: BusinessCard) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) return;
      
      const isLiked = card.likedBy.includes(user.id);
      
      // Optimistic update
      const updatedCards = cards.map(c => {
          if (c.id === card.id) {
              const newLikedBy = isLiked 
                  ? c.likedBy.filter(id => id !== user.id) // Remove
                  : [...c.likedBy, user.id]; // Add
              return { ...c, likedBy: newLikedBy };
          }
          return c;
      });
      setCards(updatedCards);
      
      try {
          await storageService.toggleLike(card.id, user.id);
      } catch (err) {
          console.error("Like failed", err);
          fetchData(); // Re-fetch to ensure sync
      }
  };

  const handleImport = async (e: React.MouseEvent, card: BusinessCard) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) return;

      setImportingId(card.id);
      try {
          await storageService.duplicateCard(card, user.id);
          alert("Biglietto importato nei tuoi luoghi!");
          setImportingId(null);
      } catch (err) {
          console.error(err);
          alert("Errore durante l'importazione");
          setImportingId(null);
      }
  };

  const getCategoryAvatar = (type: PlaceType) => {
      switch(type) {
          case PlaceType.RESTAURANT:
              return (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-500">
                      <Utensils size={32} />
                  </div>
              );
          case PlaceType.HOTEL:
              return (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                      <Bed size={32} />
                  </div>
              );
          case PlaceType.OTHER:
              return (
                  <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600">
                      <Ticket size={32} />
                  </div>
              );
          default:
              return (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                      <MapPin size={32} />
                  </div>
              );
      }
  };

  const FilterChip = ({ type }: { type: PlaceType | 'All' }) => (
    <button
      onClick={() => setActiveFilter(type)}
      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        activeFilter === type 
          ? 'bg-emerald-500 text-white shadow-md' 
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {type === 'All' ? 'Tutti' : type}
    </button>
  );

  return (
    <div className="p-4 space-y-6 relative">
      
      {/* View Mode Tabs */}
      <div className="bg-gray-200 p-1 rounded-xl flex shadow-inner">
          <button 
            onClick={() => setViewMode('mine')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                viewMode === 'mine' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
              <UserIcon size={16} />
              <span>I Miei Luoghi</span>
          </button>
          <button 
            onClick={() => setViewMode('community')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                viewMode === 'community' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
              <Users size={16} />
              <span>Community</span>
          </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
            type="text"
            placeholder={viewMode === 'mine' ? "Cerca nei tuoi luoghi..." : "Cerca nella community..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm bg-white focus:ring-2 focus:ring-emerald-500 text-gray-800"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
        <FilterChip type="All" />
        <FilterChip type={PlaceType.RESTAURANT} />
        <FilterChip type={PlaceType.HOTEL} />
        <FilterChip type={PlaceType.OTHER} />
      </div>

      {/* Stats */}
      <div className="flex justify-between items-end">
        <h2 className="text-xl font-bold text-gray-800">
            {viewMode === 'mine' ? 'La tua collezione' : 'Esplora Community'}
        </h2>
        {!isLoading && !fetchError && <span className="text-sm text-gray-500">{filteredCards.length} Luoghi</span>}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : fetchError ? (
         <div className="text-center py-10 bg-red-50 rounded-xl border border-red-100 p-4">
             <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
             <p className="text-gray-700 font-medium mb-2">{fetchError}</p>
             <button 
                onClick={fetchData}
                className="text-sm bg-white border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-50"
             >
                 Riprova
             </button>
         </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {filteredCards.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">
                    {viewMode === 'mine' 
                        ? 'Nessun biglietto trovato.' 
                        : 'Nessun biglietto nella community.'}
                </p>
                {viewMode === 'mine' && (
                    <Link to="/add" className="mt-2 inline-block text-emerald-600 font-medium hover:underline">
                    Aggiungi il primo!
                    </Link>
                )}
            </div>
            ) : (
            filteredCards.map(card => {
                const hasCoords = card.lat && card.lng;
                const isMine = user && card.userId === user.id;
                const isLiked = user ? card.likedBy.includes(user.id) : false;
                const likeCount = card.likedBy.length;

                return (
                <div key={card.id} className="relative group">
                    <Link to={`/card/${card.id}`} className="block">
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex h-32">
                        {/* Image Section - NOW WITH COLORFUL AVATARS */}
                        <div className="w-32 bg-gray-200 relative">
                        {card.imageFront ? (
                            <img src={`data:image/jpeg;base64,${card.imageFront}`} alt={card.name} className="w-full h-full object-cover" />
                        ) : (
                           getCategoryAvatar(card.type)
                        )}
                        </div>
                        
                        {/* Content Section */}
                        <div className="flex-1 p-3 flex flex-col justify-between pl-4">
                            <div>
                                <h3 className="font-bold text-gray-800 leading-tight mb-1 truncate pr-16">{card.name}</h3>
                                <div className="flex items-start text-xs text-gray-500">
                                <div title={hasCoords ? "Posizione OK" : "Posizione mancante"}>
                                    <MapPin size={12} className={`mr-1 mt-0.5 flex-shrink-0 ${hasCoords ? "text-emerald-500 fill-emerald-100" : "text-gray-300"}`} />
                                </div>
                                <span className="line-clamp-2">{card.address}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex space-x-1 items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={10} className={`${i < card.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <div className="flex space-x-2 items-center">
                                    {/* BIP CONVENTION BADGE */}
                                    {card.type === PlaceType.HOTEL && card.bipConvention && (
                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200" title="Convenzione Bip Attiva">
                                            Bip
                                        </span>
                                    )}

                                    {card.averageCost && (
                                        <span className="text-[10px] text-gray-500 font-medium flex items-center">
                                            {card.averageCost}€
                                        </span>
                                    )}
                                    {/* Show likes in community mode or if > 0 */}
                                    {(viewMode === 'community' || likeCount > 0) && (
                                        <span className={`text-[10px] font-bold flex items-center bg-pink-50 px-1.5 py-0.5 rounded-full ${isLiked ? 'text-pink-600' : 'text-gray-400'}`}>
                                            <Heart size={8} className={`mr-0.5 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                                            {likeCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </Link>

                    {/* Action Buttons (Only for my cards) */}
                    {isMine ? (
                        <div className="absolute top-2 right-2 flex space-x-1">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/edit/${card.id}`);
                                }}
                                className="p-1.5 bg-white/90 rounded-full shadow-sm text-gray-600 hover:text-emerald-600 hover:bg-white backdrop-blur-sm transition-colors border border-gray-100"
                            >
                                <Pencil size={14} />
                            </button>
                            
                            <button 
                                onClick={(e) => handleDelete(e, card.id)}
                                className={`p-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all border border-gray-100 flex items-center space-x-1 ${
                                    deleteConfirmId === card.id 
                                    ? 'bg-red-500 text-white w-auto px-2' 
                                    : 'bg-white/90 text-gray-600 hover:text-red-600 hover:bg-white'
                                }`}
                            >
                                {deleteConfirmId === card.id ? (
                                    <>
                                        <span className="text-[10px] font-bold">Confermi?</span>
                                        <Check size={14} />
                                    </>
                                ) : (
                                    <Trash2 size={14} />
                                )}
                            </button>
                        </div>
                    ) : (
                        // Community Actions
                        <div className="absolute top-2 right-2 flex space-x-1">
                             <button 
                                onClick={(e) => handleLike(e, card)}
                                className={`p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white backdrop-blur-sm transition-colors border border-gray-100 ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                            >
                                <Heart size={14} className={isLiked ? "fill-pink-500 text-pink-500" : ""} />
                            </button>
                            <button 
                                onClick={(e) => handleImport(e, card)}
                                title="Copia nei miei luoghi"
                                className="p-1.5 bg-white/90 rounded-full shadow-sm text-gray-600 hover:text-emerald-600 hover:bg-white backdrop-blur-sm transition-colors border border-gray-100"
                            >
                                {importingId === card.id ? <Loader2 size={14} className="animate-spin" /> : <Import size={14} />}
                            </button>
                        </div>
                    )}
                </div>
            )})
            )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;