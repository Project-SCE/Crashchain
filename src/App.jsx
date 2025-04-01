import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useState } from 'react';
import Header from './components/header';
import Login from './components/login';
import SignUp from './components/signup';
import Hero from './components/hero';
import ContentSection from './components/contentsection';
import Footer from './components/footer';
import DashBoard from './pages/dashboard';
import FileUpload from './pages/upload';
import HardwareSimulator from './pages/Hardsim';

function ScrollHandler() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo.slice(1));
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return null;
}

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Web3Provider>
      <Router>
        <ScrollHandler />
        <div className="min-h-screen bg-gray-100">
          <Header />
          <Routes>
            <Route path="/" element={<><Hero /><ContentSection /></>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/upload" element={<FileUpload />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashBoard /></ProtectedRoute>} />
            <Route path="/hardsim" element={<ProtectedRoute><HardwareSimulator /></ProtectedRoute>} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
