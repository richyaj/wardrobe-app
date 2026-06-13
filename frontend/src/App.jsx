import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Wardrobe from './pages/Wardrobe';
import Schedule from './pages/Schedule';
import Layout from './components/Layout';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"  element={<Guest><Login /></Guest>} />
          <Route path="/signup" element={<Guest><Signup /></Guest>} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Wardrobe />} />
            <Route path="schedule" element={<Schedule />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
