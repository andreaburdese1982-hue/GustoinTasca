
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Loader2, Save, X, Sparkles, MapPin, Euro, ConciergeBell, Info } from 'lucide-react';
import { storageService } from '../services/storageService';
import { analyzeBusinessCard, fileToGenerativePart } from '../services/geminiService';
import { BusinessCard, PlaceType, HOTEL_AMENITIES } from '../types';

const AddCard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [formData, setFormData] = useState<Partial<BusinessCard>>({
    name: '',
    type: PlaceType.RESTAURANT,
    address: '',
    phone: '',
    website: '',
    email: '',
    tags: [],
    services: [],
    bipConvention: undefined,
    notes: '',
    rating: 0,
    averageCost: undefined,
    lat: undefined,
    lng: undefined
  });

  useEffect(() => {
    if (id) {
        const loadCard = async () => {
            setIsLoadingData(true);
            const card = await storageService.getCard(id);
            if (card) {
                setFormData(card);
                if (card.imageFront) {
                    setImagePreview(`data:image/jpeg;base64,${card.imageFront}`);
                }
            } else {
                setError("Biglietto non trovato");
            }
            setIsLoadingData(false);
        };
        loadCard();
    }
  }, [id]);

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

  const handleManualGeocode = async (addressToSearch?: string) => {
      const addr = addressToSearch || formData.address;
      if (!addr) return null;
      setIsGeocoding(true);
      const coords = await fetchCoordinates(addr);
      if (coords) {
          setFormData(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }));
          setError(null);
      } else {
          setError("Indirizzo non trovato sulla mappa.");
      }
      setIsGeocoding(false);
      return coords;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsProcessing(true);
        setError(null);
        
        // 1. Preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // 2. Extract Data via Gemini
        // FIX: Spacchettiamo l'oggetto { data, mimeType }
        const { data, mimeType } = await fileToGenerativePart(file);
        
        // Passiamo solo la stringa base64 e il tipo MIME
        const extracted = await analyzeBusinessCard(data, mimeType);

        let finalLat = extracted.lat;
        let finalLng = extracted.lng;

        if ((!finalLat || !finalLng) && extracted.address) {
            const coords = await fetchCoordinates(extracted.address);
            if (coords) {
                finalLat = coords.lat;
                finalLng = coords.lng;
            }
        }

        setFormData(prev => ({
          ...prev,
          name: extracted.name || '',
          type: extracted.type || PlaceType.RESTAURANT,
          address: extracted.address || '',
          phone: extracted.phone || '',
          website: extracted.website || '',
          email: extracted.email || '',
          tags: extracted.suggestedTags || [],
          services: extracted.suggestedServices || [],
          imageFront: data, 
          lat: finalLat,
          lng: finalLng
        }));

      } catch (err) {
        console.error(err);
        setError("Impossibile analizzare il biglietto. Inserisci i dati manualmente.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const toggleService = (service: string) => {
      const currentServices = formData.services || [];
      if (currentServices.includes(service)) {
          setFormData({ ...formData, services: currentServices.filter(s => s !== service) });
      } else {
          setFormData({ ...formData, services: [...currentServices, service] });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Il nome è obbligatorio.");
      return;
    }

    setIsSaving(true);
    try {
        const user = await storageService.getCurrentUser();
        if (!user) {
            setError("Sessione scaduta.");
            return;
        }

        const cardToSave: BusinessCard = {
            id: id || `card_${Date.now()}`,
            userId: user.id,
            name: formData.name || '',
            type: formData.type as PlaceType,
            address: formData.address || '',
            phone: formData.phone || '',
            website: formData.website || '',
            email: formData.email || '',
            tags: formData.tags || [],
            services: formData.services || [],
            bipConvention: formData.bipConvention,
            notes: formData.notes || '',
            rating: formData.rating || 0,
            averageCost: formData.averageCost,
            imageFront: '', 
            createdAt: formData.createdAt || Date.now(),
            lat: formData.lat,
            lng: formData.lng,
            likedBy: formData.likedBy || []
        };

        await storageService.saveCard(cardToSave);
        navigate(id ? `/card/${id}` : '/');
    } catch (err: any) {
        setError(err.message || "Errore durante il salvataggio.");
    } finally {
        setIsSaving(false);
    }
  };

  const getTypeColorClass = (type: string) => {
      if (formData.type === type) {
          switch (type) {
              case PlaceType.RESTAURANT: return 'bg-orange-50 border-orange-500 text-orange-700 font-bold';
              case PlaceType.HOTEL: return 'bg-blue-50 border-blue-500 text-blue-700 font-bold';
              case PlaceType.OTHER: return 'bg-purple-50 border-purple-500 text-purple-700 font-bold';
              default: return 'bg-emerald-50 border-emerald-500 text-emerald-700';
          }
      }
      return 'border-gray-200 text-gray-600 hover:bg-gray-50';
  };

  if (isLoadingData) {
      return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      );
  }

  return (
    <div className="p-4 min-h-full bg-white pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">{id ? 'Modifica Biglietto' : 'Nuovo Biglietto'}</h2>
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreview ? 'border-emerald-500' : 'border-gray-300 hover:bg-gray-50'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center text-emerald-600 animate-pulse">
            <Loader2 size={32} className="animate-spin mb-2" />
            <span className="text-sm font-medium">Analisi con IA in corso...</span>
          </div>
        ) : imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
        ) : (
          <>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <Camera size={24} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Scatta foto o Carica</p>
          </>
        )}
      </div>

      <div className="mt-2 flex items-start p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
        <Info size={16} className="mr-2 flex-shrink-0 mt-0.5" />
        <p>L'IA leggerà i dati dal biglietto per te, ma <b>la foto non verrà salvata</b> per privacy.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!id && formData.name && (
            <div className="p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center">
                <Sparkles size={14} className="mr-2" />
                Dati estratti automaticamente.
            </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome del Locale</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia</label>
          <div className="flex space-x-2">
            {[PlaceType.RESTAURANT, PlaceType.HOTEL, PlaceType.OTHER].map(t => (
                <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({...formData, type: t})}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${getTypeColorClass(t)}`}
                >
                    {t}
                </button>
            ))}
          </div>
        </div>

        {formData.type === PlaceType.HOTEL && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <label className="block text-sm font-bold text-blue-800 mb-1">Convenzione Bip?</label>
                    <select
                        value={formData.bipConvention === true ? 'true' : formData.bipConvention === false ? 'false' : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                                ...formData, 
                                bipConvention: val === 'true' ? true : val === 'false' ? false : undefined
                            });
                        }}
                        className="w-full p-2 text-sm rounded-lg border border-gray-200 outline-none"
                    >
                        <option value="">Seleziona...</option>
                        <option value="true">Sì</option>
                        <option value="false">No</option>
                    </select>
                </div>
                <div className="flex flex-wrap gap-2">
                    {HOTEL_AMENITIES.map(amenity => (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleService(amenity)}
                            className={`px-3 py-1.5 text-xs rounded-full border ${formData.services?.includes(amenity) ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                        >
                            {amenity}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
          <div className="flex space-x-2">
            <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value, lat: undefined, lng: undefined})}
                className="flex-1 p-3 rounded-lg border border-gray-200 outline-none"
                placeholder="Via Roma 1, Milano"
            />
            <button 
                type="button" 
                onClick={() => handleManualGeocode()}
                className={`p-3 rounded-lg border ${formData.lat ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50'}`}
            >
                {isGeocoding ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 rounded-lg border border-gray-200 outline-none"
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valutazione</label>
            <select
                value={formData.rating}
                onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
                className="w-full p-3 rounded-lg border border-gray-200 outline-none bg-white"
            >
                {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v} Stelle</option>)}
            </select>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Medio (€)</label>
            <div className="relative">
                <input
                    type="number"
                    value={formData.averageCost || ''}
                    onChange={e => setFormData({...formData, averageCost: Number(e.target.value)})}
                    className="w-full p-3 pl-10 rounded-lg border border-gray-200 outline-none"
                />
                <Euro className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note Personali</label>
          <textarea
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full p-3 rounded-lg border border-gray-200 outline-none h-24 resize-none"
          />
        </div>

        <button 
            type="submit" 
            disabled={isProcessing || isSaving}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-70 flex items-center justify-center space-x-2"
        >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            <span>{id ? 'Aggiorna Biglietto' : 'Salva Biglietto'}</span>
        </button>
      </form>
    </div>
  );
};

export default AddCard;
