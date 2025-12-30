import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import ClassDetailPage from './pages/ClassDetailPage';
import UserHomePage from './pages/UserHomePage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminReservationsPage from './pages/AdminReservationsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- VEŘEJNÁ ČÁST --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/class/:id" element={<ClassDetailPage />} />
        
        {/* --- PŘIHLÁŠENÝ UŽIVATEL --- */}
        <Route path="/home" element={<UserHomePage />} />
        <Route path="/dashboard" element={<UserDashboardPage />} />

        {/* --- ADMIN ČÁST --- */}
        {/* Hlavní admin rozcestník (odpovídá Linku /admin v sidebaru) */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        
        {/* Zachování zpětné kompatibility pro /admin/dashboard - přesměruje na /admin */}
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        
        {/* Správa rezervací pro admina */}
        <Route path="/admin/reservations" element={<AdminReservationsPage />} />

        {/* --- FALLBACK --- */}
        {/* Pokud uživatel zadá neexistující adresu, pošleme ho domů */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;