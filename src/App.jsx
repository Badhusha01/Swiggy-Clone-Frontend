import { useState } from 'react'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './Pages/AuthPage';
import AdminDashboard from './Pages/AdminDashboard';
import { AuthProvider } from './Context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default path-ku AuthPage (Login) varum */}
          <Route path="/" element={<AuthPage />} />
          
          {/* Admin path */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Vera ethavadhu path type panna Login-ke kootitu poidum */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;