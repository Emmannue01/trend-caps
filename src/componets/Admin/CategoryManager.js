import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, setDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoriesCollectionRef = collection(db, 'categories');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(categoriesCollectionRef, orderBy('createdAt', 'desc'));
      const data = await getDocs(q);
      const fetchedCategories = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setCategories(fetchedCategories);
      setError('');
    } catch (err) {
      setError('Falló al cargar las categorías.');
      console.error(err);
    }
    setLoading(false);
  }, [categoriesCollectionRef]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (e) => {
    e.preventDefault();
    if (newCategoryName.trim() === '') return;

    // Usamos el nombre para generar un slug como ID del documento
    const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      setError("Nombre de categoría inválido.");
      return;
    }

    try {
      const categoryRef = doc(db, 'categories', slug);
      await setDoc(categoryRef, { 
        name: newCategoryName.trim(),
        slug: slug,
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      setError('Falló al crear la categoría. ¿Quizás ya existe?');
      console.error(err);
    }
  };

  const deleteCategory = async (id) => {
    if (window.confirm('¿Estás seguro? Esto NO eliminará los productos dentro de la categoría.')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        fetchCategories();
      } catch (err) {
        setError('Falló al eliminar la categoría.');
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Gestionar Categorías</h2>
      <form onSubmit={createCategory} className="mb-6 flex gap-2">
        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nombre de la nueva categoría" className="flex-grow p-2 border rounded-md" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Añadir</button>
      </form>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <p className="font-medium">{category.name} <span className="text-sm text-gray-400">({category.slug})</span></p>
            <button onClick={() => deleteCategory(category.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;