import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Plus, Edit, Trash2, Search, X, UploadCloud } from 'lucide-react';


const CLOUDINARY_UPLOAD_PRESET = 'SistemaGestion'; 
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/dtf8s8epz/image/upload`;
// ------------------------------------

const InventoryManager = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: 'gorras', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', stock: '', category: 'gorras', image: '' });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    let imageUrl = formData.image;

    try {
      // 1. Subir imagen a Cloudinary si hay un archivo nuevo
      if (imageFile) {
        const data = new FormData();
        data.append('file', imageFile);
        data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_API_URL, {
          method: 'POST',
          body: data,
        });
        const file = await res.json();
        if (file.secure_url) {
          imageUrl = file.secure_url;
        } else {
          throw new Error('Error al subir la imagen a Cloudinary');
        }
      }

      // 2. Guardar datos del producto en Firestore (con la URL de Cloudinary)
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: formData.category === 'playeras'
            ? {
                S: parseInt(formData.stock.S || 0, 10),
                M: parseInt(formData.stock.M || 0, 10),
                L: parseInt(formData.stock.L || 0, 10),
                XL: parseInt(formData.stock.XL || 0, 10),
              }
            : parseInt(formData.stock || 0, 10),
        category: formData.category,
        image: imageUrl,
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto: " + error.message);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const getTotalStock = (stock) => {
    if (typeof stock === 'object' && stock !== null) {
        return Object.values(stock).reduce((sum, count) => sum + (parseInt(count, 10) || 0), 0);
    }
    return stock;
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const openEditModal = (product) => {
    setEditingProduct(product);
    const stockData = (product.category === 'playeras' && typeof product.stock !== 'object')
        ? { S: 0, M: 0, L: 0, XL: 0 } // Fallback for old data
        : product.stock;
    setFormData({ ...product, stock: stockData });
    setImagePreview(product.image || '');
    setShowModal(true);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" /> Nuevo Producto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar productos..." 
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.image && <img src={product.image} alt={product.name} className="h-10 w-10 rounded-full object-cover mr-3" />}
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {getTotalStock(product.stock)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" required className="mt-1 w-full border rounded-md p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio</label>
                  <input type="number" step="0.01" required className="mt-1 w-full border rounded-md p-2" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                {formData.category !== 'playeras' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input type="number" required className="mt-1 w-full border rounded-md p-2" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select 
                  required 
                  className="mt-1 w-full border rounded-md p-2 bg-white" 
                  value={formData.category} 
                  onChange={e => {
                    const newCategory = e.target.value;
                    const newStock = newCategory === 'playeras' ? { S: 0, M: 0, L: 0, XL: 0 } : '';
                    setFormData({ ...formData, category: newCategory, stock: newStock });
                  }}
                >
                  <option value="gorras">Gorras</option>
                  <option value="playeras">Playeras</option>
                </select>
              </div>
              {formData.category === 'playeras' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock por Talla</label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {['S', 'M', 'L', 'XL'].map(size => (
                      <div key={size}>
                        <label htmlFor={`stock-${size}`} className="block text-xs font-medium text-gray-500 text-center">{size}</label>
                        <input
                          id={`stock-${size}`}
                          type="number"
                          value={typeof formData.stock === 'object' ? formData.stock[size] || '' : ''}
                          onChange={e => {
                            const newStock = { ...(typeof formData.stock === 'object' ? formData.stock : {}), [size]: e.target.value };
                            setFormData({ ...formData, stock: newStock });
                          }}
                          className="w-full border rounded-md p-2 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Previsualización" className="mx-auto h-24 w-auto rounded-md object-cover" />
                    ) : (
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Sube un archivo</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                      </label>
                      <p className="pl-1">o arrástralo aquí</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isUploading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                {isUploading ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
