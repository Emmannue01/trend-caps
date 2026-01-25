import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home.js';
import Login from './componets/Login.js';
import RegisterForm from './componets/RegisterForm.js';
import ForgotPasswordForm from './componets/ForgotPasswordForm.js';
import Profile from './pages/Profile.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/carrito" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<RegisterForm />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordForm />} />
      </Routes>
    </Router>
  );
}

export default App;