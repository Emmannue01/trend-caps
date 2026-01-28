import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import '../componets/navbar.js';
import '../componets/footer.js';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Cargar usuario
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        setEmail(currentUser.email || '');

        // Cargar datos adicionales de Firestore
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPhone(data.phone || '');
            setStreet(data.street || '');
            setNeighborhood(data.neighborhood || '');
            setCity(data.city || '');
            setState(data.state || '');
            setZipCode(data.zipCode || '');
            setCountry(data.country || '');
          }

          // Cargar historial de pedidos
          try {
            const ordersRef = collection(db, "users", currentUser.uid, "orders");
            // Intentar ordenar por fecha si existe el índice, si no, traerlos tal cual
            const q = query(ordersRef, orderBy('date', 'desc')); 
            const querySnapshot = await getDocs(q).catch(() => getDocs(ordersRef));
            
            const ordersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(ordersList);
          } catch (orderErr) {
            console.error("Error cargando pedidos:", orderErr);
          }
        } catch (err) {
          console.error("Error al cargar datos del usuario:", err);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    // Cargar contador del carrito para el navbar
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
      } catch (e) {
        console.error("Error parsing cart", e);
      }
    }

    return () => unsubscribe();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user) return;

    const promises = [];

    if (displayName !== user.displayName) {
      promises.push(updateProfile(user, { displayName: displayName }));
    }

    if (email !== user.email) {
      promises.push(updateEmail(user, email));
    }

    // Guardar datos extendidos en Firestore
    const userRef = doc(db, "users", user.uid);
    promises.push(setDoc(userRef, {
      displayName,
      email,
      phone,
      street,
      neighborhood,
      city,
      state,
      zipCode,
      country
    }, { merge: true }));

    try {
      await Promise.all(promises);
      setMessage('Perfil actualizado correctamente.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Para cambiar configuraciones sensibles (email/contraseña), por favor cierra sesión y vuelve a entrar.');
      } else {
        setError('Error al actualizar el perfil: ' + err.message);
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <capstyle-navbar count={cartCount}></capstyle-navbar>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Editar Perfil</h2>
          
          {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">{message}</div>}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Para coordinar la entrega"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Datos de Envío</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calle y Número</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Colonia / Barrio</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">C. Postal</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-medium"
            >
              Guardar Cambios
            </button>
          </form>

          {/* Historial de Pedidos */}
          <div className="mt-10 border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Historial de Pedidos</h3>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aún no has realizado pedidos.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">Pedido #{order.id.slice(0, 8)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'Entregado' ? 'bg-green-100 text-green-800' : 
                        order.status === 'Enviado' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status || 'Procesando'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>{order.date ? new Date(order.date.seconds * 1000).toLocaleDateString() : 'Fecha desconocida'}</span>
                      <span className="font-bold text-gray-800">${order.total || '0.00'}</span>
                    </div>
                    {order.items && (
                      <ul className="mt-3 space-y-2 text-sm">
                        {order.items.map(item => (
                          <li key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <Link to={`/producto/${item.productId}`} className="text-blue-600 hover:underline">
                              {item.name} {item.size && `(${item.size})`}
                            </Link>
                            <span className="text-gray-600">{item.quantity} x ${(item.price || 0).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <capstyle-footer></capstyle-footer>
    </div>
  );
};

export default Profile;
