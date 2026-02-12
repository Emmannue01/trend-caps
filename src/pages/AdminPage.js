// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, DollarSign, LogOut, Menu, X, Tag, LayoutGrid } from 'lucide-react';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import InventoryManager from '../componets/Admin/InventoryManager';
import CategoryManager from '../componets/Admin/CategoryManager';
import CouponManager from '../componets/Admin/CouponManager';
import OrderManager from '../componets/Admin/OrderManager';
import PointOfSale from '../componets/Admin/PointOfSale';
import EarningsDashboard from '../componets/Admin/EarningsDashboard';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Verificar si el usuario es admin
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().isAdmin === true) {
          setUser(currentUser);
        } else {
          
          navigate('/');
        }
      } else {
       
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;

  if (!user) return null; // La redirección ya se maneja en el useEffect

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory': return <InventoryManager />;
      case 'categories': return <CategoryManager />;
      case 'orders': return <OrderManager />;
      case 'coupons': return <CouponManager />;
      case 'pos': return <PointOfSale />;
      case 'dashboard':
      default: return <EarningsDashboard />;
    }
  };

  const NavButton = ({ tab, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(tab); setSidebarOpen(false); }} 
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <Icon size={20} /> <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className={`bg-white w-64 shadow-xl flex-col hidden md:flex z-10`}>
        <div className="p-6 border-b flex items-center justify-center">
           <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
             <DollarSign className="bg-blue-600 text-white rounded p-1" size={32}/> Trend-Admin
           </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavButton tab="dashboard" icon={LayoutDashboard} label="Panel Principal" />
          <NavButton tab="inventory" icon={Package} label="Inventario" />
          <NavButton tab="categories" icon={LayoutGrid} label="Categorías" />
          <NavButton tab="orders" icon={ShoppingCart} label="Pedidos" />
          <NavButton tab="coupons" icon={Tag} label="Cupones" />
          <NavButton tab="pos" icon={DollarSign} label="Punto de Venta" />
        </nav>
        <div className="p-4 border-t bg-gray-50">
          <div className="mb-4 px-2 text-sm text-gray-500 truncate">{user.email}</div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
            <LogOut size={18} /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-30 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Menú Admin</h1>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-500"><X size={24} /></button>
        </div>
        <nav className="p-4 space-y-2">
          <NavButton tab="dashboard" icon={LayoutDashboard} label="Panel Principal" />
          <NavButton tab="inventory" icon={Package} label="Inventario" />
          <NavButton tab="categories" icon={LayoutGrid} label="Categorías" />
          <NavButton tab="orders" icon={ShoppingCart} label="Pedidos" />
          <NavButton tab="coupons" icon={Tag} label="Cupones" />
          <NavButton tab="pos" icon={DollarSign} label="Punto de Venta" />
          <div className="pt-4 mt-4 border-t">
            <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
              <LogOut size={20} /> <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden">
           <span className="font-bold text-lg text-gray-800">Administración</span>
           <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100"><Menu size={24} /></button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
