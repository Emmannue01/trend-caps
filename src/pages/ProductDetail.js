// src/pages/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import '../componets/navbar.js';
import '../componets/footer.js';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('No se ha especificado un producto.');
        setLoading(false);
        return;
      }

      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() });
        } else {
          setError('Producto no encontrado.');
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError('Error al cargar el producto.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    // Disparar evento global para que Home.js lo capture
    window.dispatchEvent(new CustomEvent('add-to-cart', {
      detail: { productId: product.id }
    }));
    navigate('/carrito'); // Opcional: redirigir al carrito
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Volver al inicio</button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <capstyle-navbar count={0}></capstyle-navbar> {/* Idealmente, el count vendría de un estado global */}
      <main className="container mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black mb-6">
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna de Imagen */}
          <div>
            <img src={product.image} alt={product.name} className="w-full h-auto max-h-[70vh] object-contain rounded-lg" />
          </div>
          {/* Columna de Detalles */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-4">Categoría: {product.category}</p>
            <div className="flex items-baseline gap-3 mb-6">
              {product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price) ? (
                <><span className="text-3xl font-bold text-red-600">${parseFloat(product.salePrice).toFixed(2)}</span><span className="text-xl text-gray-400 line-through">${parseFloat(product.price).toFixed(2)}</span></>
              ) : (<span className="text-3xl font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</span>)}
            </div>
            <p className="text-gray-700 mb-6 flex-grow">{product.description || 'Este producto no tiene una descripción detallada.'}</p>
            <div className="mt-auto">
              {typeof product.stock === 'object' ? (<button onClick={() => window.dispatchEvent(new CustomEvent('select-size', { detail: { ...product, productId: product.id } }))} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Seleccionar Talla</button>) : (<button onClick={handleAddToCart} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Añadir al Carrito</button>)}
            </div>
          </div>
        </div>
      </main>
      <capstyle-footer></capstyle-footer>
    </div>
  );
};

export default ProductDetail;