import React from 'react';
import { ArrowLeft, Shield, Lock, Server, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SectionProps {
  title: string;
  icon: any;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center space-x-2 mb-3 text-emerald-700">
      <Icon size={24} />
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2 text-justify">
      {children}
    </div>
  </div>
);

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Privacy & Cookie Policy</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            
            <p className="text-xs text-gray-400 mb-6">Ultimo aggiornamento: Ottobre 2024</p>

            <Section title="1. Titolare del Trattamento" icon={Shield}>
              <p>
                Benvenuto su <strong>GustoinTasca</strong>. La presente informativa descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali. 
                L'applicazione è fornita a scopo dimostrativo e di utilità personale per la gestione di biglietti da visita.
              </p>
            </Section>

            <Section title="2. Dati Raccolti" icon={Server}>
              <p>Per fornire il servizio, trattiamo le seguenti tipologie di dati:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Dati Account:</strong> Email, Nome ed eventualmente password crittografata (tramite Supabase Auth).</li>
                <li><strong>Contenuti Utente:</strong> Dati dei biglietti da visita inseriti (nomi locali, indirizzi, note, tag).</li>
                <li><strong>Immagini:</strong> Le foto scattate vengono inviate temporaneamente all'AI per l'analisi e <strong>non vengono salvate</strong> in modo permanente sui nostri server per risparmiare spazio e tutelare la privacy, a meno che non venga specificato diversamente.</li>
              </ul>
            </Section>

            <Section title="3. Posizione e GPS" icon={MapPin}>
              <p>
                L'app richiede l'accesso alla posizione del dispositivo (GPS) esclusivamente per:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Mostrare la tua posizione sulla mappa rispetto ai locali salvati.</li>
                <li>Calcolare le coordinate dei nuovi biglietti da visita inseriti.</li>
              </ul>
              <p className="mt-2">
                I dati di posizione non vengono tracciati in background né venduti a terzi.
              </p>
            </Section>

            <Section title="4. Servizi Terzi" icon={Lock}>
              <p>Utilizziamo servizi di terze parti sicuri per il funzionamento dell'app:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Google Gemini AI:</strong> Per l'estrazione dei testi dalle foto. Le immagini vengono processate e poi scartate.</li>
                <li><strong>Supabase:</strong> Per l'autenticazione sicura e il salvataggio dei dati nel cloud (Server siti in EU/US).</li>
                <li><strong>OpenStreetMap / Leaflet:</strong> Per la visualizzazione delle mappe.</li>
              </ul>
            </Section>

            <Section title="5. Cookie e Storage Locale" icon={Server}>
              <p>
                Questa applicazione utilizza <strong>Cookie Tecnici</strong> e <strong>Local Storage</strong> strettamente necessari per:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Mantenere l'utente loggato (token di sessione).</li>
                <li>Ricordare le preferenze (es. accettazione privacy).</li>
              </ul>
              <p className="mt-2">
                Non utilizziamo cookie di profilazione pubblicitaria.
              </p>
            </Section>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-gray-800 mb-2">I tuoi diritti</h3>
                <p className="text-sm text-gray-600">
                    Hai il diritto di accedere, rettificare o cancellare i tuoi dati in qualsiasi momento direttamente dall'app (eliminando l'account o i singoli biglietti) o contattando il supporto tecnico.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;