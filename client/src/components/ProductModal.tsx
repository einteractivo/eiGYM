import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import ProductService, { type Product } from '../services/ProductService';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSuccess, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        costPrice: '',
        price: '',
        stock: '',
        photoUrl: '',
        active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                costPrice: (product.costPrice || 0).toString(),
                price: product.price.toString(),
                stock: product.stock.toString(),
                photoUrl: product.photoUrl || '',
                active: product.active
            });
        } else {
            setFormData({
                name: '',
                description: '',
                costPrice: '0',
                price: '',
                stock: '0',
                photoUrl: '',
                active: true
            });
        }
    }, [product, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (product) {
                await ProductService.updateProduct(product.id, {
                    ...formData,
                    costPrice: parseFloat(formData.costPrice),
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock)
                });
            } else {
                await ProductService.createProduct({
                    ...formData,
                    costPrice: parseFloat(formData.costPrice),
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock)
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al guardar producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[2.5rem] w-full max-w-2xl shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 transition-colors shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {product ? 'Editar Artículo' : 'Nuevo Artículo'}
                        </h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Gestión de inventario físico</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="text-xs font-black uppercase tracking-tight">{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">NOMBRE DEL ARTÍCULO *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                placeholder="Ej: Proteína Whey 1kg"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">URL DE IMAGEN</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    name="photoUrl"
                                    value={formData.photoUrl}
                                    onChange={handleChange}
                                    className="flex-1 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                    placeholder="https://..."
                                />
                                {formData.photoUrl && (
                                    <div className="w-12 h-12 rounded-xl border border-gray-100 dark:border-white/10 p-1 bg-white dark:bg-slate-800 shadow-sm shrink-0 overflow-hidden">
                                        <img
                                            src={formData.photoUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-lg"
                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Error')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">DESCRIPCIÓN</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-medium text-sm min-h-[80px]"
                            placeholder="..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">PRECIO COMPRA (S/) *</label>
                            <input
                                type="number"
                                name="costPrice"
                                value={formData.costPrice}
                                onChange={handleChange}
                                required
                                step="0.01"
                                min="0"
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3 text-slate-900 dark:text-white text-xl font-black focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all italic tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">PRECIO VENTA (S/) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                step="0.01"
                                min="0"
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3 text-slate-900 dark:text-white text-xl font-black focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all italic tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">STOCK ACTUAL *</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3 text-slate-900 dark:text-white text-xl font-black focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                placeholder="0"
                            />
                        </div>

                        <div className="flex items-center gap-4 px-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl transition-all hover:border-gym-primary/30 group self-end h-[58px]">
                            <input
                                type="checkbox"
                                id="active"
                                name="active"
                                checked={formData.active}
                                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                className="w-6 h-6 rounded-lg accent-slate-900 dark:accent-gym-primary cursor-pointer"
                            />
                            <label htmlFor="active" className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest cursor-pointer group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                Disponible para venta
                            </label>
                        </div>
                    </div>

                    {formData.costPrice && formData.price && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-2 transition-all">
                            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Utilidad estimada por unidad:</span>
                            <span className="text-xl font-black italic tracking-tighter text-green-600 dark:text-green-400">
                                S/ {(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-gray-50 dark:border-white/5 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 dark:bg-gym-primary hover:bg-slate-800 dark:hover:bg-gym-primary/90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white dark:text-slate-900 font-black px-10 py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-none uppercase tracking-widest text-xs min-w-[180px]"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} strokeWidth={3} />
                                    <span>{product ? 'Actualizar' : 'Registrar'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
