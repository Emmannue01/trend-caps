// src/components/Admin/CouponManager.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, setDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, X } from 'lucide-react';

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'coupons'), orderBy('code'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({ code: '', discountType: 'percentage', discountValue: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      const couponCode = formData.code.toUpperCase();
      const couponData = {
        code: couponCode,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        isActive: true,
        createdAt: new Date(),
      };
      // Usar el código como ID del documento para evitar duplicados
      await setDoc(doc(db, 'coupons', couponCode), couponData);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating coupon:", error);
      alert("Error al crear el cupón.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cupón?')) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Cupones</h2>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" /> Nuevo Cupón
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 font-mono text-sm font-bold text-purple-700">{coupon.code}</td>
                <td className="px-6 py-4 text-sm">{coupon.discountType === 'percentage' ? 'Porcentaje' : 'Fijo'}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <div className="text-center text-gray-500 py-8">No hay cupones creados.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nuevo Cupón</h3>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Código</label>
                <input type="text" required className="mt-1 w-full border rounded-md p-2 uppercase" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Tipo de Descuento</label>
                  <select className="mt-1 w-full border rounded-md p-2 bg-white" value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Valor</label>
                  <input type="number" step="0.01" required className="mt-1 w-full border rounded-md p-2" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Crear Cupón
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManager;