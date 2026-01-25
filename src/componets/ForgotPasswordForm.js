import React, { useState } from 'react';
import { Mail, ShoppingBag } from 'lucide-react';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebase.js';
import { Link } from 'react-router-dom';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam).");
    } catch (err) {
      console.error("Error de Firebase al enviar correo de restablecimiento:", err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No se encontró ningún usuario con este correo electrónico.');
          break;
        case 'auth/invalid-email':
          setError('El formato del correo electrónico no es válido.');
          break;
        default:
          setError('Hubo un problema al enviar el correo de restablecimiento.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-indigo-800" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Recuperar Contraseña</h1>
          <p className="text-gray-600 mt-2">Ingresa tu correo para recibir un enlace de restablecimiento.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-black" size={20} />
              </div>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="text-black w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="tu@correo.com" />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}

          <div>
            <button type="submit" disabled={isLoading || success} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {isLoading ? 'Enviando...' : 'Enviar correo'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Volver a Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}