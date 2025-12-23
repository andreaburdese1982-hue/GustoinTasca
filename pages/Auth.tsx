
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Pre-fill demo credentials for better UX
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123'); 
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // VALIDATION
    if (!cleanEmail) {
        setError('Inserisci la tua email.');
        return;
    }

    if (mode !== 'forgot' && !cleanPassword) {
        setError('Inserisci la password.');
        return;
    }

    setIsLoading(true);
    try {
        if (mode === 'login') {
            // LOGIN
            const user = await storageService.login(cleanEmail, cleanPassword);
            if (user) {
                onLogin();
            } else {
                setError('Credenziali non valide. Verifica email e password.');
            }
        } else if (mode === 'register') {
            // REGISTER
            if (name) {
                await storageService.register(name, cleanEmail, cleanPassword);
                onLogin();
            } else {
                setError('Compila tutti i campi.');
            }
        } else if (mode === 'forgot') {
            // RESET PASSWORD
            await storageService.resetPassword(cleanEmail);
            setSuccessMsg(`Abbiamo inviato un link di ripristino a ${cleanEmail}. Controlla la tua posta (anche spam).`);
        }
    } catch (err: any) {
        console.error(err);
        if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
             setError("Errore di connessione al database. Controlla la tua rete o le chiavi Supabase.");
        } else {
             setError(err.message || 'Si è verificato un errore. Riprova.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
      setMode(newMode);
      setError('');
      setSuccessMsg('');
      
      if (newMode === 'login') {
          setEmail('demo@example.com');
          setPassword('demo123');
      } else if (newMode === 'register') {
          setEmail('');
          setPassword('');
      } else if (newMode === 'forgot') {
          setPassword('');
          // Keep email if typed
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl mb-6">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">GT</div>
            <h1 className="text-2xl font-bold text-gray-800">GustoinTasca</h1>
            <p className="text-sm text-gray-500">I tuoi viaggi, i tuoi sapori.</p>
        </div>

        {mode === 'forgot' ? (
            /* --- FORGOT PASSWORD FORM --- */
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-gray-700">Recupero Password</h2>
                    <p className="text-xs text-gray-500">Inserisci la tua email per ricevere il link di reset.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="nome@esempio.com"
                    />
                </div>

                {successMsg && <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded border border-emerald-100">{successMsg}</div>}
                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading || !!successMsg}
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-70 flex justify-center items-center"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Invia Link'}
                </button>

                <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2 text-gray-500 text-sm hover:text-emerald-600 flex items-center justify-center space-x-1"
                >
                    <ArrowLeft size={16} />
                    <span>Torna al Login</span>
                </button>
            </form>
        ) : (
            /* --- LOGIN / REGISTER FORM --- */
            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Il tuo nome"
                    />
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="nome@esempio.com"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        {mode === 'login' && (
                            <button 
                                type="button" 
                                onClick={() => switchMode('forgot')}
                                className="text-xs text-emerald-600 hover:underline"
                            >
                                Password dimenticata?
                            </button>
                        )}
                    </div>
                    <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="******"
                    />
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-70 flex justify-center items-center"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Accedi' : 'Registrati')}
                </button>
            </form>
        )}
        
        {mode !== 'forgot' && (
            <div className="mt-6 text-center">
                <button 
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} 
                    className="text-sm text-emerald-600 hover:underline"
                    disabled={isLoading}
                >
                    {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                </button>
            </div>
        )}
        
        {mode === 'login' && (
             <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 text-center">
                 <p className="font-bold mb-1">Credenziali Demo:</p>
                 <p>Email: demo@example.com</p>
                 <p>Password: (qualsiasi)</p>
             </div>
        )}
      </div>
      
      {/* Privacy Footer Link */}
      <div className="text-center">
        <Link to="/privacy" className="text-xs text-gray-400 hover:text-gray-600 underline">
            Privacy & Cookie Policy
        </Link>
      </div>
    </div>
  );
};

export default Auth;
