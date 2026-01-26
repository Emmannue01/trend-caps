import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/home.css';
import '../componets/navbar.js';
import '../componets/product-card.js';
import '../componets/footer.js';
import '../componets/cart-modal.js';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [sizeModalProduct, setSizeModalProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartModalRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const productsCollectionRef = useMemo(() => collection(db, 'products'), []);

  // 1. Escuchar el estado de autenticación del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Cargar productos y derivar categorías desde Firestore
  useEffect(() => {
    const getProductsAndDeriveCategories = async () => {
      setLoadingCategories(true);
      try {
        const productsSnapshot = await getDocs(productsCollectionRef);
        const productsData = productsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setProducts(productsData);

        // Derivar categorías desde los productos
        const derivedCategories = productsData.reduce((acc, product) => {
          if (product.category && !acc.some(cat => cat.slug === product.category)) {
            acc.push({
              id: product.category, // Usar el slug de la categoría como ID
              name: product.category.charAt(0).toUpperCase() + product.category.slice(1), // Capitalizar
              slug: product.category,
            });
          }
          return acc;
        }, []);
        
        setCategories(derivedCategories);

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    getProductsAndDeriveCategories();
  }, [productsCollectionRef]);

  // 2. Cargar el carrito y fusionar si es necesario
  useEffect(() => {
    const loadAndMergeCart = async () => {
      if (user) {
        // Usuario logueado
        const cartCollectionRef = collection(db, 'users', user.uid, 'cart');
        const firestoreSnapshot = await getDocs(cartCollectionRef);
        const firestoreCart = firestoreSnapshot.docs.map(doc => doc.data());
        
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');

        if (localCart.length > 0) {
            // Hay un carrito local, fusionar con el de Firestore
            const mergedCart = [...firestoreCart];
            const batch = writeBatch(db);

            localCart.forEach(localItem => {
                const existingItemIndex = mergedCart.findIndex(item => item.id === localItem.id);
                if (existingItemIndex > -1) {
                    // El item ya existe, sumar cantidades
                    mergedCart[existingItemIndex].quantity += localItem.quantity;
                } else {
                    // Item nuevo, añadirlo
                    mergedCart.push(localItem);
                }
            });

            // Actualizar Firestore con el carrito fusionado
            mergedCart.forEach(item => {
                const itemRef = doc(db, 'users', user.uid, 'cart', item.id);
                batch.set(itemRef, item);
            });
            
            await batch.commit();
            setCart(mergedCart);
            localStorage.removeItem('cart'); // Limpiar carrito local
        } else {
            // No hay carrito local, solo cargar el de Firestore
            setCart(firestoreCart);
        }
      } else {
        // Usuario no logueado: Cargar desde localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (e) {
            console.error("Error al parsear el carrito de localStorage", e);
            setCart([]);
          }
        } else {
          setCart([]);
        }
      }
    };
    loadAndMergeCart();
  }, [user]);

  // Sincronizar estado del carrito con la ruta
  useEffect(() => {
    if (location.pathname === '/carrito') {
      setIsCartOpen(true);
    } else {
      setIsCartOpen(false);
    }
  }, [location]);

  useEffect(() => {
    const handleSelectSize = (e) => {
      setSizeModalProduct(e.detail);
    };
    window.addEventListener('select-size', handleSelectSize);
    return () => {
      window.removeEventListener('select-size', handleSelectSize);
    };
  }, []);

  useEffect(() => {
    const handleQuickView = (e) => {
      setQuickViewProduct(e.detail);
    };
    window.addEventListener('quick-view', handleQuickView);
    return () => {
      window.removeEventListener('quick-view', handleQuickView);
    };
  }, []);

  // 3. Funciones de modificación del carrito (ahora asíncronas)
  const addToCart = useCallback(async (productId, size = null) => {
    const productToAdd = products.find(p => p.id === productId);
    if (!productToAdd) return;

    const cartId = size ? `${productId}-${size}` : productId;

    const existingItem = cart.find(item => item.id === cartId);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

    const cartItem = {
        ...productToAdd,
        id: cartId,
        productId: productId,
        quantity: newQuantity,
        ...(size && { size: size })
    };

    if (user) {
      // Guardar en Firestore
      const itemRef = doc(db, 'users', user.uid, 'cart', cartId);
      await setDoc(itemRef, cartItem, { merge: true });
    }

    // Actualizar estado local
    if (existingItem) {
      setCart(prevCart => prevCart.map(item =>
        item.id === cartId ? { ...item, quantity: newQuantity } : item
      ));
    } else {
      const newItemForState = {
          ...productToAdd,
          id: cartId,
          productId: productId,
          quantity: 1,
          ...(size && { size: size })
      };
      setCart(prevCart => [...prevCart, newItemForState]);
    }
    setIsCartOpen(true);
  }, [products, cart, user]);

  // Manejar eventos del carrito (Agregar y Abrir)
  useEffect(() => {
    const handleAddToCart = (e) => {
      addToCart(e.detail.productId, null);
    };

    const handleOpenCart = () => navigate('/carrito');

    window.addEventListener('add-to-cart', handleAddToCart);
    window.addEventListener('open-cart', handleOpenCart);

    return () => {
      window.removeEventListener('add-to-cart', handleAddToCart);
      window.removeEventListener('open-cart', handleOpenCart);
    };
  }, [addToCart, navigate]);

  const handleUpdateQuantity = useCallback(async (id, change) => {
    const itemInCart = cart.find(item => item.id === id);
    if (!itemInCart) return;

    const newQty = Math.max(1, itemInCart.quantity + change);

    if (user) {
      const itemRef = doc(db, 'users', user.uid, 'cart', id);
      await updateDoc(itemRef, { quantity: newQty });
    }

    setCart(prevCart => prevCart.map(item => {
      return item.id === id ? { ...item, quantity: newQty } : item;
    }));
  }, [cart, user]);

  const handleRemoveItem = useCallback(async (id) => {
    if (user) {
      const itemRef = doc(db, 'users', user.uid, 'cart', id);
      await deleteDoc(itemRef);
    }
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, [user]);

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
  }, [cart, isCartOpen, location, navigate, user, handleUpdateQuantity, handleRemoveItem]);
  // 4. Guardar carrito en localStorage SOLO si el usuario no está logueado
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  const handleAddToCartWithSize = (product, size) => {
    addToCart(product.productId, size);
    setSizeModalProduct(null); // Close modal
  };

  // Componente para la tarjeta de categoría con carrusel
  const CategoryCarouselCard = ({ category, allProducts }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const productImages = useMemo(() => 
        allProducts
            .filter(p => p.category === category.slug && p.image)
            .map(p => p.image),
        [allProducts, category.slug]
    );

    const displayImages = productImages.length > 0 
        ? productImages 
        : ['https://via.placeholder.com/640x360.png?text=Sin+Productos'];

    useEffect(() => {
      if (displayImages.length <= 1) return;

      const interval = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % displayImages.length);
      }, 3000); // Cambia cada 3 segundos

      return () => clearInterval(interval); // Limpia el intervalo al desmontar
    }, [displayImages.length]);

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % displayImages.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + displayImages.length) % displayImages.length);
    };

    return (
        <div className="category-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer relative group">
            <img src={displayImages[currentIndex]} alt={category.name} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
            {displayImages.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:opacity-100"><ChevronLeft size={20} /></button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:opacity-100"><ChevronRight size={20} /></button>
                </>
            )}
            <div className="p-4"><h3 className="font-medium">{category.name}</h3></div>
        </div>
    );
  };

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
            {loadingCategories ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
              ))
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCarouselCard key={category.id} category={category} allProducts={products} />
              ))
            ) : <p className="col-span-full text-center text-gray-500">No hay categorías para mostrar.</p>}
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Nuestros Productos</h2>
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
                stock={JSON.stringify(product.stock)}
                image={product.image}
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

      {/* Size Selection Modal */}
      {sizeModalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs text-center">
            <h3 className="text-lg font-bold mb-2">Selecciona una talla</h3>
            <p className="text-sm text-gray-600 mb-4">Para: {sizeModalProduct.name}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {Object.entries(sizeModalProduct.stock)
                .filter(([, count]) => count > 0)
                .map(([size, count]) => (
                  <button
                    key={size}
                    onClick={() => handleAddToCartWithSize(sizeModalProduct, size)}
                    className="px-4 py-2 border rounded-md hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white focus:outline-none transition-colors"
                  >
                    {size} <span className="text-xs text-gray-400">({count})</span>
                  </button>
                ))}
            </div>
            <button
              onClick={() => setSizeModalProduct(null)}
              className="w-full text-center text-sm text-gray-500 hover:text-black"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setQuickViewProduct(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col md:flex-row gap-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute -top-3 -right-3 text-white bg-gray-800 rounded-full p-1 hover:bg-black transition-colors"
            >
              <X size={24} />
            </button>
            <div className="md:w-1/2 p-4">
              <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            </div>
            <div className="md:w-1/2 p-6 flex flex-col">
              <h2 className="text-3xl font-bold mb-2 text-gray-800">{quickViewProduct.name}</h2>
              <p className="text-2xl font-semibold text-blue-600 mb-4">${quickViewProduct.price}</p>
              <p className="text-gray-600 mb-6 flex-grow">{quickViewProduct.description || 'Sin descripción disponible.'}</p>
              
              <div className="mt-auto">
                {typeof quickViewProduct.stock === 'object' ? (
                  <>
                    <p className="text-sm font-medium mb-3">Selecciona una talla:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(quickViewProduct.stock)
                        .filter(([, count]) => count > 0)
                        .map(([size]) => (
                          <button
                            key={size}
                            onClick={() => {
                              addToCart(quickViewProduct.productId, size);
                              setQuickViewProduct(null);
                            }}
                            className="w-12 h-12 border rounded-md hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white focus:outline-none transition-colors font-semibold"
                          >
                            {size}
                          </button>
                        ))
                      }
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      addToCart(quickViewProduct.productId, null);
                      setQuickViewProduct(null);
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Añadir al Carrito
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;