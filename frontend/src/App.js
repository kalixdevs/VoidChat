import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');
    const username = urlParams.get('username');
    const email = urlParams.get('email');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      window.history.replaceState({}, document.title, '/login');
    } else if (token && userId && username) {
      const userData = {
        id: parseInt(userId),
        username: decodeURIComponent(username),
        email: decodeURIComponent(email || '')
      };
      handleLogin(token, userData);
      window.history.replaceState({}, document.title, '/rooms');
      window.location.href = '/rooms';
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={token ? <Navigate to="/rooms" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={token ? <Navigate to="/rooms" /> : <Register onLogin={handleLogin} />} 
          />
          <Route 
            path="/auth/callback" 
            element={<div>Processing login...</div>} 
          />
          <Route 
            path="/rooms" 
            element={token ? <RoomList token={token} user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/room/:roomId" 
            element={token ? <ChatRoom token={token} user={user} /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to={token ? "/rooms" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

