
import { BusinessCard, User, PlaceType } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURAZIONE SUPABASE ---

// Funzione helper per ottenere le variabili d'ambiente in modo sicuro
const getEnvVar = (key: string, defaultValue: string): string => {
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) { return defaultValue; }
    return defaultValue;
};

// 1. URL DEL PROGETTO (Tenta da env, altrimenti usa default)
const SUPABASE_URL = getEnvVar("SUPABASE_URL", "https://tenikrfcpahyqbdcvxlx.supabase.co");

// 2. CHIAVE ANONIMA (Tenta da env, altrimenti usa quella manuale)
const MANUAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbmlrcmZjcGFoeXFiZGN2eGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTUxODMsImV4cCI6MjA4MDA5MTE4M30.sj_gc5trwKvvkKTF9MuCErtU-pPYxL7TlGpUyTWfQyc"; 
const SUPABASE_KEY = getEnvVar("SUPABASE_KEY", MANUAL_KEY);

// -------------------------------

const USERS_KEY = 'gustointasca_users';
const CARDS_KEY = 'gustointasca_cards';
const CURRENT_USER_KEY = 'gustointasca_current_user';

// Initialize Supabase if keys are present
let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                detectSessionInUrl: true,
                persistSession: true,
                autoRefreshToken: true
            }
        });
        console.log("GustoinTasca: Connected to Supabase Engine");
    } catch (e) {
        console.error("GustoinTasca: Failed to initialize Supabase", e);
    }
} else {
    console.warn("GustoinTasca: Keys missing. Running in Demo Mode (LocalStorage).");
}

// Helper to simulate network delay for Mock Mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to migrate old 'Altro' type to 'Esperienze'
const normalizeType = (type: string): PlaceType => {
    if (type === 'Altro') return PlaceType.OTHER;
    return type as PlaceType;
};

/* =========================================
   MOCK IMPLEMENTATION (LOCAL STORAGE)
   ========================================= */
const MockService = {
  seed: () => {
    try {
        const usersStr = localStorage.getItem(USERS_KEY);
        let users: User[] = usersStr ? JSON.parse(usersStr) : [];
        if (!Array.isArray(users)) users = [];

        const demoExists = users.some(u => u.email === 'demo@example.com');
        if (!demoExists) {
            const demoUser: User = {
                id: 'user_1',
                name: 'Mario Rossi',
                email: 'demo@example.com',
                avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=10b981&color=fff'
            };
            users.push(demoUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
    } catch(e) { console.error(e); }
  },

  login: async (email: string): Promise<User | null> => {
    await delay(600);
    const normalizedEmail = email.trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email.toLowerCase() === normalizedEmail);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: async (name: string, email: string): Promise<User> => {
    await delay(800);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const existing = users.find((u: User) => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (existing) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existing));
        return existing;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email: email.trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout: async (): Promise<void> => {
    await delay(200);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  resetPassword: async (email: string): Promise<void> => {
      await delay(1000);
      console.log(`Mock: Password reset email sent to ${email}`);
      return;
  },

  updatePassword: async (password: string): Promise<void> => {
      await delay(1000);
      console.log("Mock: Password updated successfully");
      return;
  },

  getCurrentUser: async (): Promise<User | null> => {
    await delay(300); 
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  getCards: async (userId: string, mode: 'mine' | 'community' = 'mine'): Promise<BusinessCard[]> => {
    await delay(700);
    const allCards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    return allCards
      .filter((card: BusinessCard) => {
          if (mode === 'mine') return card.userId === userId;
          else return card.userId !== userId; // Community
      })
      .map((card: any) => ({
          ...card,
          type: normalizeType(card.type),
          likedBy: card.likedBy || (card.likes ? ['legacy_likes'] : [])
      }))
      .sort((a: BusinessCard, b: BusinessCard) => b.createdAt - a.createdAt);
  },

  getCard: async (id: string): Promise<BusinessCard | undefined> => {
    await delay(400);
    const allCards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    const card = allCards.find((card: BusinessCard) => card.id === id);
    if (card) {
        return { 
            ...card, 
            type: normalizeType(card.type),
            likedBy: card.likedBy || [] 
        };
    }
    return undefined;
  },

  saveCard: async (card: BusinessCard): Promise<void> => {
    await delay(800);
    const allCards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    const index = allCards.findIndex((c: BusinessCard) => c.id === card.id);
    if (index >= 0) {
      allCards[index] = card;
    } else {
      allCards.push(card);
    }
    localStorage.setItem(CARDS_KEY, JSON.stringify(allCards));
  },

  deleteCard: async (id: string): Promise<void> => {
    await delay(500);
    const allCards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    const filtered = allCards.filter((c: BusinessCard) => c.id !== id);
    localStorage.setItem(CARDS_KEY, JSON.stringify(filtered));
  },

  toggleLike: async (cardId: string, userId: string): Promise<void> => {
      await delay(200);
      const allCards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
      const index = allCards.findIndex((c: BusinessCard) => c.id === cardId);
      if (index >= 0) {
          const card = allCards[index];
          card.likedBy = card.likedBy || [];
          if (card.likedBy.includes(userId)) {
              card.likedBy = card.likedBy.filter((id: string) => id !== userId);
          } else {
              card.likedBy.push(userId);
          }
          localStorage.setItem(CARDS_KEY, JSON.stringify(allCards));
      }
  },

  duplicateCard: async (card: BusinessCard, newUserId: string) => {
      const newCard: BusinessCard = {
          ...card,
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
          userId: newUserId,
          createdAt: Date.now(),
          likedBy: []
      };
      await MockService.saveCard(newCard);
  }
};

if (!supabase) MockService.seed();

/* =========================================
   REAL IMPLEMENTATION (SUPABASE)
   ========================================= */
const SupabaseService = {
  auth: () => supabase?.auth,

  logout: async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },
  
 resetPassword: async (email: string): Promise<void> => {
      if (!supabase) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // Forza l'URL autorizzato su Supabase
          redirectTo: 'https://gusto-in-tasca.vercel.app/#/profile'
      });
      if (error) throw error;
},

  updatePassword: async (password: string): Promise<void> => {
      if (!supabase) return;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;
    return {
        id: session.user.id,
        name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        avatar: `https://ui-avatars.com/api/?name=${session.user.email}&background=10b981&color=fff`
    };
  },

  getCards: async (userId: string, mode: 'mine' | 'community' = 'mine'): Promise<BusinessCard[]> => {
      if (!supabase) return [];
      let query = supabase.from('business_cards').select('*');
      if (mode === 'mine') {
          query = query.eq('user_id', userId);
      } else {
          query = query.neq('user_id', userId).limit(50);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];
      return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          type: normalizeType(d.type),
          address: d.address,
          phone: d.phone,
          website: d.website,
          email: d.email,
          tags: d.tags || [],
          services: d.services || [],
          bipConvention: d.bip_convention,
          notes: d.notes,
          rating: d.rating,
          averageCost: d.average_cost,
          imageFront: d.image_front,
          createdAt: d.created_at,
          lat: d.lat,
          lng: d.lng,
          likedBy: d.liked_by || []
      }));
  },

  getCard: async (id: string): Promise<BusinessCard | undefined> => {
      if (!supabase) return undefined;
      const { data, error } = await supabase.from('business_cards').select('*').eq('id', id).single();
      if (error || !data) return undefined;
      return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          type: normalizeType(data.type),
          address: data.address,
          phone: data.phone,
          website: data.website,
          email: data.email,
          tags: data.tags || [],
          services: data.services || [],
          bipConvention: data.bip_convention,
          notes: data.notes,
          rating: data.rating,
          // Fixed property name from average_cost to averageCost to match BusinessCard interface
          averageCost: data.average_cost,
          imageFront: data.image_front,
          createdAt: data.created_at,
          lat: data.lat,
          lng: data.lng,
          likedBy: data.liked_by || []
      };
  },

  saveCard: async (card: BusinessCard): Promise<void> => {
      if (!supabase) return;
      const payload: any = {
          user_id: card.userId,
          name: card.name,
          type: card.type,
          address: card.address,
          phone: card.phone,
          website: card.website,
          email: card.email,
          tags: card.tags,
          services: card.services,
          bip_convention: card.bipConvention ?? null,
          notes: card.notes,
          rating: card.rating,
          average_cost: card.averageCost ?? null,
          image_front: card.imageFront,
          lat: card.lat ?? null,
          lng: card.lng ?? null,
          liked_by: card.likedBy || []
      };

      const isUUID = card.id.length > 20 && !card.id.startsWith('card_');
      let error;

      if (isUUID) {
          const res = await supabase.from('business_cards').update(payload).eq('id', card.id);
          error = res.error;
      } else {
          const res = await supabase.from('business_cards').insert(payload);
          error = res.error;
      }

      if (error) {
          // Retry logic for schema mismatch
          if (error.message?.includes('column')) {
              if (error.message.includes('lat')) { delete payload.lat; delete payload.lng; }
              if (error.message.includes('average_cost')) delete payload.average_cost;
              if (error.message.includes('services')) delete payload.services;
              if (error.message.includes('bip_convention')) delete payload.bip_convention;
              if (error.message.includes('liked_by')) delete payload.liked_by;
              
              const retryRes = isUUID 
                ? await supabase.from('business_cards').update(payload).eq('id', card.id)
                : await supabase.from('business_cards').insert(payload);
              if (retryRes.error) throw new Error(retryRes.error.message);
              return;
          }
          throw new Error(error.message);
      }
  },

  toggleLike: async (cardId: string, userId: string): Promise<void> => {
    if (!supabase) return;
    const { data } = await supabase.from('business_cards').select('liked_by').eq('id', cardId).single();
    let likedBy: string[] = data?.liked_by || [];
    if (likedBy.includes(userId)) likedBy = likedBy.filter(id => id !== userId);
    else likedBy.push(userId);
    await supabase.from('business_cards').update({ liked_by: likedBy }).eq('id', cardId);
  },

  deleteCard: async (id: string): Promise<void> => {
      if (!supabase) return;
      const { error } = await supabase.from('business_cards').delete().eq('id', id);
      if (error) throw new Error(error.message);
  },

  duplicateCard: async (card: BusinessCard, newUserId: string) => {
      const newCard: BusinessCard = {
          ...card,
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
          userId: newUserId,
          createdAt: Date.now(),
          likedBy: []
      };
      await SupabaseService.saveCard(newCard);
  }
};

// EXPORT SERVICE WRAPPER
export const storageService = {
    isCloudActive: !!supabase,
    login: async (email: string, password?: string) => {
        if (supabase) {
            if (!password) throw new Error("Password richiesta per login cloud.");
            const { error } = await SupabaseService.auth()!.signInWithPassword({ email, password });
            if (error) throw error;
            return SupabaseService.getCurrentUser();
        }
        return MockService.login(email);
    },

    register: async (name: string, email: string, password?: string) => {
        if (supabase) {
             if (!password) throw new Error("Password richiesta per registrazione cloud.");
             const { error } = await SupabaseService.auth()!.signUp({ email, password, options: { data: { name } } });
             if (error) throw error;
             return SupabaseService.getCurrentUser() || { id: 'pending', name, email };
        }
        return MockService.register(name, email);
    },

    resetPassword: async (email: string) => supabase ? SupabaseService.resetPassword(email) : MockService.resetPassword(email),
    updatePassword: async (password: string) => supabase ? SupabaseService.updatePassword(password) : MockService.updatePassword(password),
    logout: async () => supabase ? SupabaseService.logout() : MockService.logout(),
    getCurrentUser: async () => supabase ? SupabaseService.getCurrentUser() : MockService.getCurrentUser(),
    getCards: async (uid: string, mode: 'mine' | 'community' = 'mine') => supabase ? SupabaseService.getCards(uid, mode) : MockService.getCards(uid, mode),
    getCard: async (id: string) => supabase ? SupabaseService.getCard(id) : MockService.getCard(id),
    saveCard: async (c: BusinessCard) => supabase ? SupabaseService.saveCard(c) : MockService.saveCard(c),
    deleteCard: async (id: string) => supabase ? SupabaseService.deleteCard(id) : MockService.deleteCard(id),
    toggleLike: async (id: string, uid?: string) => { if(!uid) return; return supabase ? SupabaseService.toggleLike(id, uid) : MockService.toggleLike(id, uid); },
    duplicateCard: async (c: BusinessCard, uid: string) => supabase ? SupabaseService.duplicateCard(c, uid) : MockService.duplicateCard(c, uid),
};
