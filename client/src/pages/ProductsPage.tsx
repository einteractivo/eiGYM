import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Package, Search, Inbox } from 'lucide-react';
import ProductService, { type Product } from '../services/ProductService';
import ProductModal from '../components/ProductModal';
import { cn } from '../lib/utils';

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchProducts();
    }, [search]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await ProductService.getAllProducts(search, false);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de desactivar este producto?')) {
            try {
                await ProductService.deleteProduct(id);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const openCreateModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 transition-colors duration-300">
            <div className="flex flex-col md:flex-row shadow-sm md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 transition-colors duration-300">
                <div>
                    
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Gestione los suplementos, bebidas y artículos del gym</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-slate-900 dark:bg-gym-primary hover:bg-slate-800 dark:hover:bg-gym-primary/90 text-white dark:text-slate-900 font-black px-8 py-4 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-gym-primary/10 uppercase tracking-widest text-xs"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span>Nuevo Producto</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm shadow-gray-100 dark:shadow-none transition-colors duration-300">
                {/* Filters */}
                <div className="p-8 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
                    <div className="relative group max-w-xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-gym-primary transition-colors" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre o descripción..."
                            className="w-full bg-white dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:border-gym-primary/30 focus:ring-8 focus:ring-gym-primary/5 transition-all font-bold text-sm shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5 text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-[0.2em] bg-gray-50/50 dark:bg-white/5">
                                <th className="px-8 py-6">Producto</th>
                                <th className="px-8 py-6">Precio Compra</th>
                                <th className="px-8 py-6">Precio Venta</th>
                                <th className="px-8 py-6">Ganancia</th>
                                <th className="px-8 py-6 text-center">Stock</th>
                                <th className="px-8 py-6 text-center">Estado</th>
                                <th className="px-8 py-6 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-10">
                                            <div className="h-10 bg-gray-100 rounded-2xl w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 group-hover:border-gym-primary/50 transition-all flex items-center justify-center text-slate-400 dark:text-gray-500 shadow-sm relative">
                                                    {product.photoUrl ? (
                                                        <img
                                                            src={product.photoUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Error')}
                                                        />
                                                    ) : (
                                                        <Package size={24} strokeWidth={1.5} />
                                                    )}
                                                    {product.stock <= 0 && (
                                                        <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[2px] flex items-center justify-center">
                                                            <div className="bg-red-500 text-white rounded-full p-1 shadow-lg">
                                                                <Trash2 size={12} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-900 dark:text-white uppercase text-xs tracking-tight group-hover:text-gym-primary transition-colors">{product.name}</p>
                                                    {product.description && (
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Compra</span>
                                                <span className="font-bold text-sm text-slate-600 dark:text-gray-400">
                                                    <span className="text-xs mr-1">S/</span>
                                                    {Number(product.costPrice || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Venta</span>
                                                <span className="font-black text-lg italic tracking-tighter text-slate-900 dark:text-white">
                                                    <span className="text-gym-primary text-xs not-italic mr-1">S/</span>
                                                    {Number(product.price).toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Ganancia</span>
                                                <span className="font-black text-sm text-green-600 dark:text-green-400">
                                                    <span className="text-xs mr-1">+ S/</span>
                                                    {(Number(product.price) - Number(product.costPrice || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                                product.stock <= 5
                                                    ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400"
                                                    : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-slate-500 dark:text-gray-400"
                                            )}>
                                                <Inbox size={14} strokeWidth={3} />
                                                {product.stock} UNI.
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border",
                                                product.active
                                                    ? "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400"
                                                    : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 dark:text-gray-600"
                                            )}>
                                                {product.active ? 'Visible' : 'Oculto'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-white/5 text-slate-400 dark:text-gray-500 hover:bg-slate-900 dark:hover:bg-gym-primary hover:text-white dark:hover:text-slate-900 rounded-xl transition-all border border-gray-100 dark:border-white/10 shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500 dark:hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100 dark:border-red-500/20 shadow-sm"
                                                    title="Desactivar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center text-gray-300 dark:text-gray-800">
                                        <div className="flex flex-col items-center gap-4">
                                            <Inbox size={48} className="text-gray-100 dark:text-gray-900" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em] italic">No se encontraron productos</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchProducts}
                product={selectedProduct}
            />
        </div>
    );
};

export default ProductsPage;
