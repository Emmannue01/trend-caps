// src/components/Admin/PointOfSale.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, increment, writeBatch, collectionGroup } from 'firebase/firestore';
import { ShoppingCart, Plus, Minus, Trash } from 'lucide-react';

const PointOfSale = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeModalProduct, setSizeModalProduct] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collectionGroup(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddToCartWithSize = (product, size) => {
    const cartId = `${product.id}-${size}`;
    const existing = cart.find(item => item.id === cartId);

    if (existing) {
      setCart(cart.map(item => item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      const newItem = { 
        ...product, 
        quantity: 1, 
        id: cartId,
        productId: product.id,
        size: size 
      };
      setCart([...cart, newItem]);
    }
    setSizeModalProduct(null);
  };

  const addToCart = (product) => {
    if (typeof product.stock === 'object' && product.stock !== null) {
      setSizeModalProduct(product);
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, productId: product.id }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(
      cart.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, item.quantity + delta) } 
          : item
      ).filter(item => item.quantity > 0) // Elimina el item si la cantidad es 0
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => {
    const priceToUse = (item.salePrice && item.salePrice < item.price) ? item.salePrice : item.price;
    return sum + (priceToUse * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!window.confirm(`¿Confirmar venta por $${total.toFixed(2)}?`)) return;

    const batch = writeBatch(db);
    try {
      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, {
        items: cart,
        total: total,
        date: new Date(),
        status: 'Completado',
        type: 'pos'
      });

      for (const item of cart) {
        const productRef = doc(db, 'categories', item.category, 'products', item.productId);
        if (typeof item.stock === 'object' && item.size) {
          batch.update(productRef, {
            [`stock.${item.size}`]: increment(-item.quantity)
          });
        } else {
          batch.update(productRef, {
            stock: increment(-item.quantity)
          });
        }
      }

      await batch.commit();

      setCart([]);
      alert('Venta realizada con éxito y stock actualizado.');
    } catch (error) {
      console.error("Error en checkout:", error);
      alert("Error al procesar la venta. El stock no ha sido modificado.");
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getTotalStock = (stock) => {
    if (typeof stock === 'object' && stock !== null) {
      return Object.values(stock).reduce((sum, count) => sum + (parseInt(count, 10) || 0), 0);
    }
    return stock;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Buscar productos..." 
          className="w-full p-3 border rounded-lg shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto p-1">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer transition-all border border-transparent hover:border-blue-300 flex flex-col justify-between"
            >
              <div>
                {product.image && <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-2" />}
                <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
                <p className="text-xs text-gray-500">Stock: {getTotalStock(product.stock)}</p>
              </div>
              <div className="mt-2 font-bold text-blue-600 text-lg">
                {product.salePrice && product.salePrice < product.price 
                  ? `$${product.salePrice.toFixed(2)}` 
                  : `$${product.price.toFixed(2)}`}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg flex flex-col h-full">
        <div className="p-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart /> Carrito Actual</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">El carrito está vacío</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex-1 mr-2">
                  <h4 className="font-medium text-sm">{item.name} {item.size && `(${item.size})`}</h4>
                  <div className="text-sm text-gray-500">${item.price} x {item.quantity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={16}/></button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={16}/></button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"><Trash size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-6 border-t bg-gray-50 rounded-b-xl">
          <div className="flex justify-between items-center mb-4 text-xl font-bold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Cobrar
          </button>
        </div>
      </div>

      {sizeModalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    </div>
  );
};

export default PointOfSale;
