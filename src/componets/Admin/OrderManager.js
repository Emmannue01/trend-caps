// src/components/Admin/OrderManager.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, onSnapshot, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { Clock, CheckCircle, Truck, X } from 'lucide-react';

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Procesando': return 'bg-yellow-100 text-yellow-800';
      case 'Enviado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h2>
      <div className="grid gap-4">
        {orders.map(order => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-gray-500">#{order.id.slice(-6)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-sm text-gray-500">{order.date?.toDate ? order.date.toDate().toLocaleString() : new Date(order.date).toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700 flex justify-between max-w-md">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-gray-500">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 font-bold text-lg">Total: ${(order.total || 0).toFixed(2)}</div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 justify-center">
              <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'Procesando'); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                <Clock size={16} /> Procesando
              </button>
              <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'Enviado'); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                <Truck size={16} /> Enviado
              </button>
              <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'Completado'); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                <CheckCircle size={16} /> Completado
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="text-center text-gray-500 py-10">No hay pedidos registrados</div>}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Detalles del Pedido #{selectedOrder.id.slice(-6)}</h3>
              <button onClick={() => setSelectedOrder(null)}><X size={24} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Order Info */}
              <div>
                <h4 className="font-semibold mb-2">Información General</h4>
                <p className="text-sm"><strong>Cliente:</strong> {selectedOrder.shippingInfo?.displayName || 'N/A'}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedOrder.userEmail || 'N/A'}</p>
                <p className="text-sm"><strong>Fecha:</strong> {selectedOrder.date?.toDate ? selectedOrder.date.toDate().toLocaleString() : 'N/A'}</p>
                <p className="text-sm"><strong>Estado:</strong> <span className={`font-medium ${getStatusColor(selectedOrder.status)} px-2 py-0.5 rounded`}>{selectedOrder.status}</span></p>
                
                <h4 className="font-semibold mt-4 mb-2">Información de Envío</h4>
                <p className="text-sm"><strong>Teléfono:</strong> {selectedOrder.shippingInfo?.phone || 'N/A'}</p>
                <p className="text-sm"><strong>Dirección:</strong> {`${selectedOrder.shippingInfo?.street || ''}, ${selectedOrder.shippingInfo?.city || ''}, ${selectedOrder.shippingInfo?.state || ''} ${selectedOrder.shippingInfo?.zipCode || ''}`}</p>
                <p className="text-sm"><strong>País:</strong> {selectedOrder.shippingInfo?.country || 'N/A'}</p>
              </div>

              {/* Right Column: Items and Totals */}
              <div>
                <h4 className="font-semibold mb-2">Artículos del Pedido</h4>
                <div className="space-y-2 border-t border-b py-2">
                  {selectedOrder.items?.map(item => (
                    <Link to={`/producto/${item.productId}`} key={item.id} className="block hover:bg-gray-50 p-2 rounded-md">
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-blue-600 hover:underline">{item.name} {item.size && `(${item.size})`}</p>
                          <p className="text-gray-500">{item.quantity} x ${(item.price || 0).toFixed(2)}</p>
                        </div>
                        <p className="font-medium">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 space-y-1 text-right">
                  <p className="text-sm"><strong>Subtotal:</strong> ${(selectedOrder.subtotal || selectedOrder.total || 0).toFixed(2)}</p>
                  {selectedOrder.appliedCoupon && (
                    <p className="text-sm text-green-600">
                      <strong>Descuento ({selectedOrder.appliedCoupon.code}):</strong> -${(selectedOrder.discount || 0).toFixed(2)}
                    </p>
                  )}
                  <p className="text-lg font-bold"><strong>Total:</strong> ${(selectedOrder.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
