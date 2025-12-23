
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddCard from './pages/AddCard';
import CardDetail from './pages/CardDetail';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await storageService.getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("Auth check failed", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await storageService.logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
      return (
          <div className="h-screen flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-emerald-600 font-medium">Caricamento...</div>
              </div>
          </div>
      );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Auth onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        {/* Privacy Policy accessible without login */}
        <Route path="/privacy" element={<PrivacyPolicy />} />

        <Route path="/" element={isAuthenticated ? <Layout onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/add" element={isAuthenticated ? <AddCard /> : <Navigate to="/login" />} />
        <Route path="/edit/:id" element={isAuthenticated ? <AddCard /> : <Navigate to="/login" />} />
        <Route path="/card/:id" element={isAuthenticated ? <CardDetail /> : <Navigate to="/login" />} />
        <Route path="/map" element={isAuthenticated ? <Layout onLogout={handleLogout}><MapView /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Layout onLogout={handleLogout}><Profile /></Layout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
