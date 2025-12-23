
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Globe, Mail, Star, Trash2, Share2, Navigation, Loader2, Pencil, Check, X, Wallet, ConciergeBell, Import, Heart, Utensils, Bed, CheckCircle2, Ticket } from 'lucide-react';
import { storageService } from '../services/storageService';
import { BusinessCard, User, PlaceType } from '../types';

const CardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<BusinessCard | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Confirmation state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const user = await storageService.getCurrentUser();
        setCurrentUser(user);

        if (id) {
            const found = await storageService.getCard(id);
            if (found) {
                setCard(found);
            } else {
                navigate('/');
            }
        }
        setIsLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (isDeleting && id) {
        // Confirmed
        await storageService.deleteCard(id);
        navigate('/');
    } else {
        // Request confirmation
        setIsDeleting(true);
        // Reset after 3 seconds if not confirmed
        setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const handleImport = async () => {
      if (!card || !currentUser) return;
      setIsImporting(true);
      try {
          await storageService.duplicateCard(card, currentUser.id);
          alert("Biglietto salvato nella tua collezione!");
          navigate('/');
      } catch (e) {
          console.error(e);
          alert("Errore durante l'importazione.");
      } finally {
          setIsImporting(false);
      }
  };
  
  const handleLike = async () => {
      if (!card || !currentUser) return;
      
      const userId = currentUser.id;
      const isLiked = card.likedBy.includes(userId);
      const newLikedBy = isLiked ? card.likedBy.filter(id => id !== userId) : [...card.likedBy, userId];

      // Optimistic
      setCard({...card, likedBy: newLikedBy});

      try {
          await storageService.toggleLike(card.id, userId);
      } catch (e) { console.error(e); }
  };

  const handleShare = () => {
    if (navigator.share && card) {
      navigator.share({
        title: card.name,
        text: `Ho trovato questo posto interessante: ${card.name} - ${card.address}`,
        url: card.website
      }).catch(console.error);
    } else {
      alert("Condivisione non supportata su questo browser.");
    }
  };

  if (isLoading) {
      return (
          <div className="h-screen flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
      );
  }

  if (!card) return null;

  const isOwner = currentUser && card.userId === currentUser.id;
  const isLiked = currentUser ? card.likedBy.includes(currentUser.id) : false;
  const likeCount = card.likedBy.length;
  
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.name + ' ' + card.address)}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(card.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  // Defensive check for "Experiences" type (handles both 'Esperienze' enum and legacy 'Altro' string)
  const isExperience = card.type === PlaceType.OTHER || card.type === 'Altro';
  const isHotel = card.type === PlaceType.HOTEL;
  const isRestaurant = card.type === PlaceType.RESTAURANT;

  // --- UI HELPERS FOR NO-IMAGE HEADER ---
  const getHeaderBackground = () => {
      if (isRestaurant) return "bg-gradient-to-br from-orange-400 to-red-500";
      if (isHotel) return "bg-gradient-to-br from-blue-400 to-indigo-600";
      if (isExperience) return "bg-gradient-to-br from-purple-500 to-indigo-700";
      return "bg-gradient-to-br from-emerald-400 to-teal-600";
  };

  const getHeaderIcon = () => {
      if (isRestaurant) return <Utensils size={64} className="text-white/30" />;
      if (isHotel) return <Bed size={64} className="text-white/30" />;
      if (isExperience) return <Ticket size={64} className="text-white/30" />;
      return <MapPin size={64} className="text-white/30" />;
  };

  return (
    <div className="min-h-full bg-white relative pb-20">
      {/* Header Image */}
      <div className={`relative h-64 ${!card.imageFront ? getHeaderBackground() : 'bg-gray-900'}`}>
        {card.imageFront ? (
          <img 
            src={`data:image/jpeg;base64,${card.imageFront}`} 
            alt={card.name} 
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getHeaderIcon()}
          </div>
        )}
        
        {/* Top Actions */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-center text-white z-10">
          <button onClick={() => navigate('/')} className="p-2 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/40 transition">
            <ArrowLeft size={24} />
          </button>
          <div className="flex space-x-2">
            
            {/* Share Button (Always Visible) */}
            <button onClick={handleShare} className="p-2 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50 transition">
              <Share2 size={20} />
            </button>
            
            {/* Community Buttons (For non-owners) */}
            {!isOwner && (
                <button onClick={handleImport} className="p-2 bg-emerald-600/80 rounded-full backdrop-blur-sm hover:bg-emerald-700 transition-colors">
                    {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Import size={20} />}
                </button>
            )}

            {/* Edit/Delete Buttons (Owner Only) */}
            {isOwner && (
                <>
                    <button onClick={() => navigate(`/edit/${card.id}`)} className="p-2 bg-emerald-600/80 rounded-full backdrop-blur-sm hover:bg-emerald-700 transition-colors">
                    <Pencil size={20} />
                    </button>
                    
                    <button 
                        onClick={handleDelete} 
                        className={`p-2 rounded-full backdrop-blur-sm transition-all flex items-center space-x-1 ${
                            isDeleting ? 'bg-red-600 text-white px-3' : 'bg-red-500/80 hover:bg-red-600'
                        }`}
                    >
                    {isDeleting ? (
                        <>
                            <span className="text-xs font-bold">Confermi?</span>
                            <Check size={16} />
                        </>
                    ) : (
                        <Trash2 size={20} />
                    )}
                    </button>
                </>
            )}
          </div>
        </div>

        {/* Floating Title Card */}
        <div className="absolute -bottom-10 left-4 right-4 bg-white p-4 rounded-xl shadow-lg z-10">
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wide ${isExperience ? 'text-purple-600' : 'text-emerald-600'}`}>
                  {card.type === 'Altro' ? 'Esperienze' : card.type}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{card.name}</h1>
            </div>
            <div className="flex flex-col items-end space-y-1">
                <div className="flex flex-col items-center bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                    <span className="text-lg font-bold text-orange-500">{card.rating}</span>
                    <div className="flex">
                        <Star size={10} className="fill-orange-400 text-orange-400" />
                    </div>
                </div>
                {/* Likes Display - Clickable if not owner */}
                <div 
                    className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${!isOwner ? 'cursor-pointer hover:bg-pink-100' : ''} ${isLiked ? 'text-pink-600 bg-pink-100' : 'text-gray-400 bg-gray-100'}`} 
                    onClick={!isOwner ? handleLike : undefined}
                >
                        <Heart size={10} className={`${isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'} mr-1`} />
                        {likeCount}
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 px-6 space-y-6">
        
        {/* Actions */}
        <div className="flex space-x-3">
          <a href={mapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 shadow hover:bg-emerald-700">
            <Navigation size={18} />
            <span>Naviga</span>
          </a>
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 shadow-sm hover:bg-gray-50">
              <Phone size={18} />
              <span>Chiama</span>
            </a>
          )}
        </div>

        {/* HOTEL SPECIFIC - BIP CONVENTION & SERVICES */}
        {isHotel && (
            <div className="space-y-3">
                {/* BIP CONVENTION BADGE */}
                {card.bipConvention === true && (
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center text-emerald-800 shadow-sm">
                        <CheckCircle2 size={20} className="mr-2 text-emerald-600" />
                        <span className="font-bold text-sm">Convenzione Bip Attiva</span>
                    </div>
                )}
                
                {/* Services List */}
                {card.services && card.services.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center space-x-2 mb-3 text-blue-800">
                            <ConciergeBell size={18} />
                            <span className="font-semibold text-sm">Servizi Offerti</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {card.services.map((service, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                                    {service}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Info List */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-gray-600">
            <MapPin className="flex-shrink-0 mt-1" size={20} />
            <span className="text-sm leading-relaxed">{card.address}</span>
          </div>
          
          {/* Average Cost */}
          {card.averageCost && (
            <div className="flex items-center space-x-3 text-gray-600">
              {isExperience ? <Ticket size={20} className="text-gray-400" /> : <Wallet size={20} className="text-gray-400" />}
              <span className="text-sm font-medium">
                  {isExperience ? 'Prezzo biglietto' : 'Costo medio'}: {card.averageCost} €
              </span>
            </div>
          )}
          
          {card.website && (
            <div className="flex items-center space-x-3 text-emerald-600">
              <Globe size={20} />
              <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} target="_blank" rel="noreferrer" className="text-sm underline truncate">
                {card.website}
              </a>
            </div>
          )}

          {card.email && (
            <div className="flex items-center space-x-3 text-gray-600">
              <Mail size={20} />
              <a href={`mailto:${card.email}`} className="text-sm">{card.email}</a>
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Tags */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tag</h3>
          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Note</h3>
          <p className="text-sm text-yellow-900 italic">
            {card.notes || "Nessuna nota aggiunta."}
          </p>
        </div>

        {/* Embedded Map */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 h-48 w-full">
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={embedUrl}
                title="Map"
            ></iframe>
        </div>
      </div>
    </div>
  );
};

export default CardDetail;
