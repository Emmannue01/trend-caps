// src/components/Admin/EarningsDashboard.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

const EarningsDashboard = () => {
  const [stats, setStats] = useState({ totalEarnings: 0, totalOrders: 0, productsSold: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      let earnings = 0;
      let count = 0;
      let items = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status !== 'cancelled') {
          earnings += data.total || 0;
          count += 1;
          data.items?.forEach(item => items += item.quantity);
        }
      });

      setStats({ totalEarnings: earnings, totalOrders: count, productsSold: items });
    });
    return () => unsubscribe();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${color}20`, color: color }}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Ganancias Totales" 
          value={`$${stats.totalEarnings.toLocaleString()}`} 
          icon={DollarSign} 
          color="#10B981" 
        />
        <StatCard 
          title="Pedidos Totales" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          color="#3B82F6" 
        />
        <StatCard 
          title="Productos Vendidos" 
          value={stats.productsSold} 
          icon={TrendingUp} 
          color="#8B5CF6" 
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar className="text-gray-400" /> Resumen de Actividad
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          Gráfico de ventas (Próximamente)
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
