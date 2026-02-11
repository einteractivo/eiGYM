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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventario de Productos</h1>
                    <p className="text-gray-400 mt-1">Gestione los suplementos, bebidas y artículos del gym</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                >
                    <Plus size={20} />
                    <span>Nuevo Producto</span>
                </button>
            </div>

            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden">
                {/* Filters */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre o descripción..."
                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase font-bold tracking-widest">
                                <th className="py-4 px-6">Producto</th>
                                <th className="py-4 px-6">Precio</th>
                                <th className="py-4 px-6">Stock</th>
                                <th className="py-4 px-6">Estado</th>
                                <th className="py-4 px-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="py-8 px-6">
                                            <div className="h-4 bg-white/5 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-gym-primary/50 transition-all flex items-center justify-center text-gym-primary">
                                                    {product.photoUrl ? (
                                                        <img
                                                            src={product.photoUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Error')}
                                                        />
                                                    ) : (
                                                        <Package size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white uppercase text-sm tracking-tight">{product.name}</p>
                                                    {product.description && (
                                                        <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 font-black text-white">S/ {Number(product.price).toFixed(2)}</td>
                                        <td className="py-5 px-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold",
                                                product.stock <= 5 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                            )}>
                                                <Inbox size={14} />
                                                {product.stock} un.
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                                product.active ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"
                                            )}>
                                                {product.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2.5 bg-white/5 hover:bg-gym-primary hover:text-white rounded-xl transition-all text-gray-400"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2.5 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all text-gray-400"
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
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-500">
                                            <Inbox size={48} strokeWidth={1} />
                                            <p className="font-medium italic">No se encontraron productos</p>
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
