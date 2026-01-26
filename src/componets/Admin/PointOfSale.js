// src/components/Admin/PointOfSale.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { ShoppingCart, Plus, Minus, Trash } from 'lucide-react';

const PointOfSale = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!window.confirm(`¿Confirmar venta por $${total}?`)) return;

    try {
      // Crear la orden
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total: total,
        date: new Date().toISOString(),
        status: 'completed',
        type: 'pos'
      });

      // Actualizar stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      }

      setCart([]);
      alert('Venta realizada con éxito');
    } catch (error) {
      console.error("Error en checkout:", error);
      alert("Error al procesar la venta");
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-500">Stock: {product.stock}</p>
              </div>
              <div className="mt-2 font-bold text-blue-600 text-lg">${product.price}</div>
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
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
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
    </div>
  );
};

export default PointOfSale;
