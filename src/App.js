import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home.js';
import Login from './componets/Login.js';
import RegisterForm from './componets/RegisterForm.js';
import ForgotPasswordForm from './componets/ForgotPasswordForm.js';
import Profile from './pages/Profile.js';
import AdminPage from './pages/AdminPage.js';
import ProductDetail from './pages/ProductDetail.js';


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
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/producto/:productId" element={<ProductDetail />} />
      </Routes>
    </Router>
  );
}

export default App;