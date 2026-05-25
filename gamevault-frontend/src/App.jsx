import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Store from './pages/Store';
import GameDetail from './pages/GameDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Library from './pages/Library';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGames from './pages/admin/AdminGames';
import AdminUsers from './pages/admin/AdminUsers';
import DeveloperHub from './pages/DeveloperHub';
import './index.css';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-wrapper">
        <Sidebar open={sidebarOpen} />
        <div className={`content-area ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Routes>
            <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/game/:id" element={<GameDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/developer" element={<ProtectedRoute role="developer"><DeveloperHub /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/games" element={<ProtectedRoute role="admin"><AdminGames /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {!isAdmin && <Footer />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <AppLayout />
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
