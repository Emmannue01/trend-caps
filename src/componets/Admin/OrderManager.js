// src/components/Admin/OrderManager.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { Clock, CheckCircle, Truck, Package } from 'lucide-react';

const OrderManager = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, 'orders', id), { status: newStatus });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h2>
      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-gray-500">#{order.id.slice(-6)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-sm text-gray-500">{new Date(order.date).toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700 flex justify-between max-w-md">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-gray-500">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 font-bold text-lg">Total: ${order.total}</div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 justify-center">
              <button onClick={() => updateStatus(order.id, 'pending')} className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                <Clock size={16} /> Pendiente
              </button>
              <button onClick={() => updateStatus(order.id, 'shipped')} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                <Truck size={16} /> Enviado
              </button>
              <button onClick={() => updateStatus(order.id, 'completed')} className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                <CheckCircle size={16} /> Completado
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="text-center text-gray-500 py-10">No hay pedidos registrados</div>}
      </div>
    </div>
  );
};

export default OrderManager;
