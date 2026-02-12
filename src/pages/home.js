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
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch, getDoc, query, where, increment, collectionGroup } from 'firebase/firestore';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [sizeModalProduct, setSizeModalProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [profileData, setProfileData] = useState({ phone: '', street: '', city: '', state: '', zipCode: '', country: '' });
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartModalRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Escuchar el estado de autenticación del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Cargar categorías y productos desde Firestore
  useEffect(() => {
    const loadData = async () => {
      setLoadingCategories(true);
      try {
        // 1. Cargar categorías
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);

        // 2. Cargar todos los productos con una Collection Group Query
        const productsSnapshot = await getDocs(collectionGroup(db, 'products'));
        const productsData = productsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        
        const regular = productsData.filter(p => !p.salePrice || p.salePrice >= p.price);
        const offers = productsData.filter(p => p.salePrice && p.salePrice < p.price);

        setProducts(regular);
        setOfferProducts(offers);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadData();
  }, []);

  // Efecto para actualizar productos filtrados cuando cambian los productos o el filtro
  useEffect(() => {
    const allProducts = [...offerProducts, ...products];
    setFilteredProducts(activeFilter === 'all' ? allProducts : allProducts.filter(p => p.category === activeFilter));
  }, [products, offerProducts, activeFilter]);

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

  // Cargar datos del perfil para el checkout
  useEffect(() => {
    const loadProfileData = async () => {
        setCouponCode(''); setAppliedCoupon(null); setCouponError(''); // Resetear cupón al abrir
        if (isCheckoutOpen && user) {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData({
                    phone: data.phone || '',
                    street: data.street || '',
                    city: data.city || '',
                    state: data.state || '',
                    zipCode: data.zipCode || '',
                    country: data.country || '',
                });
            }
        }
    };
    loadProfileData();
  }, [isCheckoutOpen, user]);

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
    const allProducts = [...products, ...offerProducts];
    const productToAdd = allProducts.find(p => p.id === productId);
    if (!productToAdd) return;

    const cartId = size ? `${productId}-${size}` : productId;

    const existingItem = cart.find(item => item.id === cartId);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
    
    // Determinar el precio a usar (oferta o normal)
    const priceToUse = (productToAdd.salePrice && productToAdd.salePrice < productToAdd.price)
        ? productToAdd.salePrice
        : productToAdd.price;

    const cartItem = {
        ...productToAdd,
        price: priceToUse, // Usar el precio correcto
        id: cartId,
        productId: productId,
        quantity: newQuantity,
        ...(size && { size: size })
    };
    delete cartItem.salePrice; // Limpiar para evitar confusiones

    if (user) {
      // Guardar en Firestore
      const itemRef = doc(db, 'users', user.uid, 'cart', cartId);
      await setDoc(itemRef, cartItem, { merge: true });
    }

    // Actualizar estado local
    if (existingItem) {
      setCart(prevCart => prevCart.map(item =>
        item.id === cartId ? { ...item, quantity: newQuantity, price: priceToUse } : item
      ));
    } else {
      const newItemForState = {
          ...productToAdd,
          price: priceToUse,
          id: cartId,
          productId: productId,
          quantity: 1,
          ...(size && { size: size })
      };
      delete newItemForState.salePrice;
      setCart(prevCart => [...prevCart, newItemForState]);
    }
    setIsCartOpen(true);
  }, [products, offerProducts, cart, user]);

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

  const handleProceedToCheckout = useCallback(() => {
    if (cart.length === 0) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [cart.length, user, navigate]);

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
      modal.addEventListener('proceed-to-checkout', handleProceedToCheckout);
      modal.addEventListener('update-quantity', handleUpdateQty);
      modal.addEventListener('remove-item', handleRemove);

      return () => {
        modal.removeEventListener('close-cart', handleClose);
        modal.removeEventListener('proceed-to-checkout', handleProceedToCheckout);
        modal.removeEventListener('update-quantity', handleUpdateQty);
        modal.removeEventListener('remove-item', handleRemove);
      };
    }
  }, [cart, isCartOpen, location, navigate, user, handleUpdateQuantity, handleRemoveItem, handleProceedToCheckout]);
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

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    setAppliedCoupon(null);

    const couponQuery = query(collection(db, "coupons"), where("code", "==", couponCode.toUpperCase()));
    const querySnapshot = await getDocs(couponQuery);

    if (querySnapshot.empty) {
      setCouponError("El cupón no es válido.");
      return;
    }

    const couponDoc = querySnapshot.docs[0];
    const couponData = { id: couponDoc.id, ...couponDoc.data() };

    // Aquí podrías añadir más validaciones (fecha de expiración, si está activo, etc.)
    
    setAppliedCoupon(couponData);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (!appliedCoupon) {
      return { subtotal, discount: 0, total: subtotal };
    }

    let discount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
    } else { // 'fixed'
      discount = appliedCoupon.discountValue;
    }
    
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
  };
  const { subtotal, discount, total } = calculateTotal();

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user || cart.length === 0) {
        setCheckoutError("No se puede procesar el pedido. El carrito está vacío o no has iniciado sesión.");
        return;
    }

    setPlacingOrder(true);
    setCheckoutError('');

    try {
        const batch = writeBatch(db);
        const { subtotal, discount, total } = calculateTotal();

        // 1. Definir los datos del pedido
        const orderData = {
            items: cart,
            subtotal: subtotal,
            discount: discount,
            appliedCoupon: appliedCoupon ? { code: appliedCoupon.code, value: appliedCoupon.discountValue, type: appliedCoupon.discountType } : null,
            total: total,
            date: new Date(),
            status: 'Procesando',
            shippingInfo: { ...profileData, displayName: user.displayName || user.email, email: user.email },
            userId: user.uid,
            userEmail: user.email,
        };

        // 2. Guardar el pedido en la colección de pedidos del usuario
        const newOrderRef = doc(collection(db, 'users', user.uid, 'orders'));
        batch.set(newOrderRef, { ...orderData, id: newOrderRef.id });

        // 3. Guardar una copia en la colección de pedidos global (para el admin)
        const globalOrderRef = doc(db, 'orders', newOrderRef.id);
        batch.set(globalOrderRef, { ...orderData, id: newOrderRef.id });

        // 4. Actualizar el stock de los productos
        for (const item of cart) {
            const productRef = doc(db, 'categories', item.category, 'products', item.productId);
            if (typeof item.stock === 'object' && item.size) {
                batch.update(productRef, { [`stock.${item.size}`]: increment(-item.quantity) });
            } else {
                batch.update(productRef, { stock: increment(-item.quantity) });
            }
        }

        // 5. Limpiar el carrito del usuario en Firestore
        const cartSnapshot = await getDocs(collection(db, 'users', user.uid, 'cart'));
        cartSnapshot.forEach(cartDoc => batch.delete(cartDoc.ref));
        
        // Ejecutar todas las operaciones atómicamente
        await batch.commit();

        // 6. Limpiar el estado del carrito local y cerrar modales
        setCart([]);
        setIsCheckoutOpen(false);
        alert('¡Pedido realizado con éxito! Serás redirigido a tu perfil para ver el estado.');
        navigate('/perfil');
    } catch (err) {
        console.error("Error al realizar el pedido:", err);
        setCheckoutError("Hubo un error al procesar tu pedido. Inténtalo de nuevo.");
    } finally {
        setPlacingOrder(false);
    }
};

const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    const allProducts = [...offerProducts, ...products];
    const filtered = filter === 'all' ? allProducts : allProducts.filter(p => p.category === filter);
    setFilteredProducts(filtered);
  };

  // Componente para la tarjeta de categoría con carrusel
  const CategoryCarouselCard = ({ category, allProducts, onCategoryClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const productImages = useMemo(() => 
        [...allProducts, ...offerProducts]
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
        <div 
            onClick={() => onCategoryClick(category.slug)}
            className="category-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer relative group"
        >
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
        <section id="categories" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Categorías Destacadas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingCategories ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
              ))
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCarouselCard 
                    key={category.id} 
                    category={category} 
                    allProducts={products} 
                    onCategoryClick={handleFilterClick}
                />
              ))
            ) : <p className="col-span-full text-center text-gray-500">No hay categorías para mostrar.</p>}
          </div>
        </section>

        {/* Offers Section */}
        {offerProducts.length > 0 && (
            <section id="offers" className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-red-600">🔥 Ofertas Especiales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {offerProducts.map(product => (
                        <product-card
                            key={product.id}
                            product-id={product.id}
                            name={product.name}
                            category={product.category}
                            description={product.description}
                            price={product.price}
                            sale-price={product.salePrice || ''}
                            stock={JSON.stringify(product.stock)}
                            image={product.image}
                        ></product-card>
                    ))}
                </div>
            </section>
        )}

        {/* Products Section */}
        <section id="products" className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Nuestros Productos</h2>
          </div>
          <div id="products-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <product-card
                key={product.id}
                product-id={product.id}
                name={product.name}
                category={product.category}
                description={product.description}
                price={product.price}
                sale-price={product.salePrice || ''}
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
              <div className="flex items-baseline gap-3 mb-4">
                {quickViewProduct.salePrice && parseFloat(quickViewProduct.salePrice) < parseFloat(quickViewProduct.price) ? (
                  <>
                    <span className="text-3xl font-bold text-red-600">${parseFloat(quickViewProduct.salePrice).toFixed(2)}</span>
                    <span className="text-xl text-gray-400 line-through">${parseFloat(quickViewProduct.price).toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-blue-600">${parseFloat(quickViewProduct.price).toFixed(2)}</span>
                )}
              </div>
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

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Confirmar Pedido</h3>
              <button onClick={() => setIsCheckoutOpen(false)}><X size={24} /></button>
            </div>

            <div className="mb-6 max-h-48 overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm mb-2">
                  <span>{item.name} {item.size && `(${item.size})`} x {item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-md border-t pt-4">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-md text-green-600">
                <span>Descuento ({appliedCoupon.code})</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold pt-2 mt-2 border-t mb-6">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cupón de Descuento</label>
              <div className="flex gap-2"><input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-md uppercase" placeholder="Escribe tu cupón" /><button type="button" onClick={handleApplyCoupon} className="px-4 py-2 text-sm border rounded-md bg-gray-100 hover:bg-gray-200 whitespace-nowrap">Aplicar</button></div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {appliedCoupon && <p className="text-green-600 text-xs mt-1">¡Cupón "{appliedCoupon.code}" aplicado!</p>}
            </div>

            <form onSubmit={handlePlaceOrder}>
              <h4 className="text-lg font-semibold mb-3">Información de Envío</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calle y Número</label>
                  <input type="text" value={profileData.street} onChange={(e) => setProfileData({...profileData, street: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input type="text" value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input type="text" value={profileData.state} onChange={(e) => setProfileData({...profileData, state: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                  <input type="text" value={profileData.zipCode} onChange={(e) => setProfileData({...profileData, zipCode: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <input type="text" value={profileData.country} onChange={(e) => setProfileData({...profileData, country: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
                </div>
              </div>

              {checkoutError && <p className="text-red-500 text-sm mt-4">{checkoutError}</p>}

              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setIsCheckoutOpen(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100">
                  Cancelar
                </button>
                <button type="submit" disabled={placingOrder} className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                  {placingOrder ? 'Procesando...' : 'Realizar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;