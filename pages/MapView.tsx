
import React, { useEffect, useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { BusinessCard, PlaceType, User } from '../types';
import { Loader2, Users, User as UserIcon, Utensils, Bed, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

// Declare Leaflet global variable since we loaded it via CDN
declare const L: any;

// Add global definition for the import function bridge
declare global {
    interface Window {
        handleImportCard: (cardId: string) => void;
        handleClosePopup: () => void;
    }
}

const MapView: React.FC = () => {
    const [cards, setCards] = useState<BusinessCard[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'mine' | 'community'>('mine');
    
    // Filter State: All active by default
    const [activeFilters, setActiveFilters] = useState<PlaceType[]>([
        PlaceType.RESTAURANT, 
        PlaceType.HOTEL, 
        PlaceType.OTHER
    ]);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]); // Keep track of markers to remove them efficiently
    const [validLocationsCount, setValidLocationsCount] = useState(0);

    // 1. Fetch User & Data
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            const currentUser = await storageService.getCurrentUser();
            setUser(currentUser);
            if (currentUser) {
                const data = await storageService.getCards(currentUser.id, viewMode);
                setCards(data);
            }
            setIsLoading(false);
        };
        initData();
    }, [viewMode]);

    // 2. Bridge Function for Popup Buttons (React <-> Leaflet HTML)
    useEffect(() => {
        window.handleImportCard = async (cardId) => {
            if (!user) return;
            
            // Find card data
            const cardToImport = cards.find(c => c.id === cardId);
            if (!cardToImport) return;

            // Visual Feedback in Popup is hard, so we use browser alert for simplicity in this bridge
            const confirmImport = window.confirm(`Vuoi salvare "${cardToImport.name}" nei tuoi luoghi?`);
            if (confirmImport) {
                try {
                    await storageService.duplicateCard(cardToImport, user.id);
                    alert("Luogo importato con successo!");
                } catch (e) {
                    alert("Errore durante l'importazione.");
                }
            }
        };

        window.handleClosePopup = () => {
            mapInstanceRef.current?.closePopup();
        };

        return () => {
            // Cleanup
            // @ts-ignore
            delete window.handleImportCard;
            // @ts-ignore
            delete window.handleClosePopup;
        };
    }, [cards, user]);

    // 3. Toggle Filters
    const toggleFilter = (type: PlaceType) => {
        setActiveFilters(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type) // Remove
                : [...prev, type] // Add
        );
    };

    // 4. Map Logic
    useEffect(() => {
        if (isLoading || !mapContainerRef.current) return;
        
        // Initialize Map if not exists
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([41.9028, 12.4964], 6);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Add Zoom Control manually to top-left
            L.control.zoom({ position: 'topleft' }).addTo(map);

            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // Clear existing markers
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        // Icons Setup
        const createIcon = (colorUrl: string) => {
            return L.icon({
                iconUrl: colorUrl,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
        };

        const redIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png');
        const blueIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png');
        const violetIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png');
        const greenIcon = createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png');

        const getIconByType = (type: PlaceType) => {
            switch (type) {
                case PlaceType.RESTAURANT: return redIcon;
                case PlaceType.HOTEL: return blueIcon;
                case PlaceType.OTHER: return violetIcon;
                default: return greenIcon;
            }
        };

        // Add Markers based on Filter
        let bounds = L.latLngBounds([]);
        let count = 0;

        cards.forEach(card => {
            // Check if coordinates exist AND category is active
            if (card.lat && card.lng && activeFilters.includes(card.type)) {
                const lat = Number(card.lat);
                const lng = Number(card.lng);

                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    const customIcon = getIconByType(card.type);
                    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
                    
                    // Store ref to remove later
                    markersRef.current.push(marker);

                    count++;
                    bounds.extend([lat, lng]);

                    // Popup Content with Custom Close Button
                    const isMyCard = viewMode === 'mine';
                    const popupContent = `
                        <div style="min-width: 180px; text-align: center; font-family: sans-serif; position: relative; padding-top: 10px;">
                            <button onclick="window.handleClosePopup()" style="position: absolute; top: -5px; right: -5px; background: none; border: none; font-size: 18px; font-weight: bold; color: #999; cursor: pointer; line-height: 1;">&times;</button>
                            
                            <strong style="display: block; font-size: 14px; margin-bottom: 4px; color: #333; padding-right: 15px;">${card.name}</strong>
                            <span style="display: block; font-size: 11px; color: #666; margin-bottom: 12px; text-transform:uppercase; font-weight:bold;">${card.type}</span>
                            
                            <div style="display: flex; gap: 6px; justify-content: center;">
                                <a 
                                href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
                                target="_blank"
                                style="background-color: #10b981; color: white; padding: 6px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: flex; align-items: center;"
                                >
                                    Naviga
                                </a>
                                
                                ${!isMyCard ? `
                                    <button 
                                        onclick="window.handleImportCard('${card.id}')"
                                        style="background-color: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; display: flex; align-items: center;"
                                    >
                                        📥 Importa
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;

                    marker.bindPopup(popupContent, { closeButton: false }); // Disable default close button
                }
            }
        });

        setValidLocationsCount(count);

        // Adjust Zoom only if markers exist and it's the first load or mode switch
        setTimeout(() => {
            map.invalidateSize();
            if (count > 0 && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }, 300);

    }, [cards, isLoading, activeFilters, viewMode]); // Re-run when filters or data change

    const FilterButton = ({ type, icon: Icon, colorClass, activeColor }: any) => {
        const isActive = activeFilters.includes(type);
        return (
            <button
                onClick={() => toggleFilter(type)}
                className={`p-2 rounded-full shadow-md border transition-all flex items-center justify-center ${
                    isActive 
                    ? `${activeColor} text-white border-transparent scale-110` 
                    : 'bg-white text-gray-400 border-gray-200 grayscale opacity-80'
                }`}
                title={type}
            >
                <Icon size={16} fill={isActive ? "currentColor" : "none"} />
            </button>
        );
    };

    return (
        <div className="h-full flex flex-col relative w-full" style={{ minHeight: '100%' }}>
            
            {/* 1. Category Filters - TOP RIGHT */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-2 pointer-events-auto">
                <FilterButton 
                    type={PlaceType.RESTAURANT} 
                    icon={Utensils} 
                    activeColor="bg-red-500" 
                />
                <FilterButton 
                    type={PlaceType.HOTEL} 
                    icon={Bed} 
                    activeColor="bg-blue-500" 
                />
                <FilterButton 
                    type={PlaceType.OTHER} 
                    icon={Ticket} 
                    activeColor="bg-purple-500" 
                />
            </div>

            {/* 2. View Switcher (Mine vs Community) - BOTTOM CENTER (Floating above nav) */}
            <div className="absolute bottom-24 left-0 right-0 z-[400] flex justify-center pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-xl border border-gray-200 flex text-sm font-bold pointer-events-auto">
                    <button 
                        onClick={() => setViewMode('mine')}
                        className={`px-4 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${viewMode === 'mine' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <UserIcon size={14} />
                        <span>I Miei</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('community')}
                        className={`px-4 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${viewMode === 'community' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Users size={14} />
                        <span>Community</span>
                    </button>
                </div>
            </div>

            {isLoading && (
                 <div className="absolute inset-0 z-[500] bg-white/80 flex items-center justify-center">
                     <Loader2 className="animate-spin text-emerald-500" size={32} />
                 </div>
            )}
            
            {/* Map Container */}
            <div id="map" ref={mapContainerRef} className="flex-1 w-full h-full z-0" style={{ height: '100%', width: '100%' }} />
            
            {/* Empty State Overlay */}
            {!isLoading && validLocationsCount === 0 && (
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 p-4 rounded-xl shadow-xl z-[400] text-center w-64 border border-gray-200">
                     <p className="text-gray-600 text-xs font-medium">
                        {viewMode === 'mine' 
                            ? "Nessun luogo con GPS nella tua lista." 
                            : "Nessun luogo visibile nella community."}
                     </p>
                 </div>
            )}
        </div>
    );
};

export default MapView;
