import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/home.css';
import '../componets/navbar.js';
import '../componets/product-card.js';
import '../componets/footer.js';
import '../componets/cart-modal.js';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', description: '', price: '', stock: '', image: '' });
  const [editingId, setEditingId] = useState(null);
  const cartModalRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const productsCollectionRef = useMemo(() => collection(db, 'products'), []);

  // Cargar productos desde Firestore al montar el componente
  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await getDocs(productsCollectionRef);
        setProducts(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };

    getProducts();

    // Verificar estado de autenticación y permisos de admin
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "autenticados", user.email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [productsCollectionRef]);

  // Cargar carrito desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Sincronizar estado del carrito con la ruta
  useEffect(() => {
    if (location.pathname === '/carrito') {
      setIsCartOpen(true);
    } else {
      setIsCartOpen(false);
    }
  }, [location]);

  // Manejar eventos del carrito (Agregar y Abrir)
  useEffect(() => {
    const handleAddToCart = (e) => {
      const { productId } = e.detail;
      const productToAdd = products.find(p => p.id === productId);
      
      if (productToAdd) {
        setCart(prevCart => {
          const existingItem = prevCart.find(item => item.id === productId);
          if (existingItem) {
            return prevCart.map(item => 
              item.id === productId 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            );
          }
          return [...prevCart, { ...productToAdd, quantity: 1 }];
        });
        setIsCartOpen(true);
      }
    };

    const handleOpenCart = () => navigate('/carrito');

    window.addEventListener('add-to-cart', handleAddToCart);
    window.addEventListener('open-cart', handleOpenCart);

    return () => {
      window.removeEventListener('add-to-cart', handleAddToCart);
      window.removeEventListener('open-cart', handleOpenCart);
    };
  }, [products, navigate]);

  // Pasar items al modal del carrito y manejar sus eventos
  useEffect(() => {
    const modal = cartModalRef.current;
    if (modal) {
      modal.items = cart;
      
      const handleClose = () => {
        setIsCartOpen(false);
        if (location.pathname === '/carrito') {
          navigate('/');
        }
      };
      const handleUpdateQty = (e) => handleUpdateQuantity(e.detail.id, e.detail.change);
      const handleRemove = (e) => handleRemoveItem(e.detail.id);

      modal.addEventListener('close-cart', handleClose);
      modal.addEventListener('update-quantity', handleUpdateQty);
      modal.addEventListener('remove-item', handleRemove);

      return () => {
        modal.removeEventListener('close-cart', handleClose);
        modal.removeEventListener('update-quantity', handleUpdateQty);
        modal.removeEventListener('remove-item', handleRemove);
      };
    }
  }, [cart, isCartOpen, location, navigate]);

  const handleUpdateQuantity = (id, change) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Inicializar Feather Icons
  useEffect(() => {
    if (window.feather) {
      window.feather.replace();
    }
  }, [showModal, products]);


  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id.replace('product-', '')]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock)
    };

    if (editingId) {
      // Actualizar producto existente
      const productDoc = doc(db, 'products', editingId);
      await updateDoc(productDoc, productData);
      setProducts(products.map(p => p.id === editingId ? { ...p, ...productData } : p));
    } else {
      // Crear nuevo producto
      const docRef = await addDoc(productsCollectionRef, productData);
      setProducts([...products, { id: docRef.id, ...productData }]);
    }
    setFormData({ name: '', category: '', description: '', price: '', stock: '', image: '' });
    setEditingId(null);
    setShowModal(false);
  };

  const handleDelete = async () => {
    const productDoc = doc(db, 'products', editingId);
    await deleteDoc(productDoc);
    setProducts(products.filter(p => p.id !== editingId));
    setFormData({ name: '', category: '', description: '', price: '', stock: '', image: '' });
    setEditingId(null);
    setShowModal(false);
  };

  const categories = [
    { name: 'Gorras', image: 'http://static.photos/fashion/640x360/1' },
    { name: 'Camisetas', image: 'http://static.photos/fashion/640x360/2' }
    
  ];

  return (
    <div className="bg-gray-50">
      <capstyle-navbar count={cart.reduce((acc, item) => acc + item.quantity, 0)}></capstyle-navbar>
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="hero bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 mb-12 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Estilo que Destaca</h1>
            <p className="text-xl mb-6">Descubre nuestra exclusiva colección de gorras y ropa para cada ocasión.</p>
            <a href="#products" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-300 inline-block">Ver Colección</a>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Categorías Destacadas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <div key={idx} className="category-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer">
                <img src={cat.image} alt={cat.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-medium">{cat.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Nuestros Productos</h2>
            {isAdmin && (
              <button onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', category: '', description: '', price: '', stock: '', image: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300">Administrar Inventario</button>
            )}
          </div>
          
          <div id="products-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <product-card
                key={product.id}
                product-id={product.id}
                name={product.name}
                category={product.category}
                description={product.description}
                price={product.price}
                stock={product.stock}
                image={product.image}
                onClick={() => { setEditingId(product.id); setFormData(product); setShowModal(true); }}
              ></product-card>
            ))}
          </div>
        </section>
      </main>
      <capstyle-footer></capstyle-footer>

      {/* Cart Modal */}
      <cart-modal 
        ref={cartModalRef}
        open={isCartOpen ? '' : null}
      ></cart-modal>

      {/* Inventory Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Administrar Inventario</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Nombre del Producto</label>
                  <input type="text" id="product-name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Categoría</label>
                  <select id="product-category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Seleccionar categoría</option>
                    <option value="gorras">Gorras</option>
                    <option value="camisetas">Camisetas</option>
                    <option value="sudaderas">Sudaderas</option>
                    <option value="accesorios">Accesorios</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Descripción</label>
                <textarea id="product-description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Precio ($)</label>
                  <input type="number" id="product-price" step="0.01" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Cantidad en Stock</label>
                  <input type="number" id="product-stock" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">URL de la Imagen</label>
                  <input type="text" id="product-image" value={formData.image} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="http://static.photos/fashion/640x360/1" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                {editingId && <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Eliminar</button>}
                {editingId && <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">Cancelar</button>}
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;