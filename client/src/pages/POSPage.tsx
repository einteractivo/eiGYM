import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Trash2, User as UserIcon, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import ProductService, { type Product } from '../services/ProductService';
import { cn } from '../lib/utils';
import SaleReceiptModal from '../components/SaleReceiptModal';

interface Member {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
}

interface CartItem extends Product {
    quantity: number;
}

const POSPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [searchProduct, setSearchProduct] = useState('');
    const [searchMember, setSearchMember] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'YAPE' | 'PLIN'>('CASH');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastCreatedSale, setLastCreatedSale] = useState<any>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [searchProduct]);

    useEffect(() => {
        if (searchMember.length > 2) {
            fetchMembers();
        } else {
            setMembers([]);
        }
    }, [searchMember]);

    const fetchProducts = async () => {
        try {
            const data = await ProductService.getAllProducts(searchProduct, true);
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/members?search=${searchMember}`);
            setMembers(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addToCart = (product: Product) => {
        setError(null);
        if (product.stock <= 0) {
            setError(`El producto ${product.name} no tiene stock disponible.`);
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    setError(`No puedes agregar más de ${product.stock} unidades de ${product.name}.`);
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return item;
                if (newQty > item.stock) {
                    setError(`Stock máximo alcanzado para ${item.name}`);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
    };

    const handleSale = async () => {
        if (cart.length === 0) {
            setError('El carrito está vacío');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await ProductService.createSale({
                memberId: selectedMember ? selectedMember.id : null,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: Number(item.price)
                })),
                paymentMethod,
                total: calculateTotal()
            });

            setSuccess(true);
            setLastCreatedSale(result);
            setIsReceiptModalOpen(true);
            setCart([]);
            setSelectedMember(null);
            setSearchMember('');
            fetchProducts();

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al procesar la venta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Punto de Venta</h1>
                    <p className="text-gray-400 mt-1">Venta rápida de suplementos y artículos</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-2xl animate-in zoom-in-95 font-bold">
                        <CheckCircle2 size={20} />
                        <span>¡Venta realizada con éxito!</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Product Selection Area */}
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                    <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex-1 flex flex-col min-h-0">
                        <div className="relative mb-6 shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
                            {products.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={cn(
                                        "p-4 rounded-3xl border transition-all text-left flex flex-col justify-between group h-max",
                                        product.stock <= 0
                                            ? "bg-white/5 border-white/5 opacity-50 grayscale cursor-not-allowed"
                                            : "bg-white/5 border-white/5 hover:border-gym-primary hover:bg-white/10"
                                    )}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-gym-primary group-hover:border-gym-primary/50 transition-all">
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
                                            <span className="font-black text-white">S/ {Number(product.price).toFixed(2)}</span>
                                        </div>
                                        <p className="font-bold text-white uppercase text-sm tracking-tight mb-1">{product.name}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1">{product.description || 'Sin descripción'}</p>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className={product.stock <= 5 ? "text-red-500" : "text-gray-400"}>
                                            Stock: {product.stock} un.
                                        </span>
                                        <span className="bg-gym-primary text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            Agregar
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart and Checkout Area */}
                <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 min-h-0">
                    <div className="bg-gym-dark border border-white/10 rounded-[2.5rem] flex flex-col min-h-0 shadow-2xl overflow-hidden relative">
                        {/* Member Selection */}
                        <div className="p-6 bg-white/5 border-b border-white/10 shrink-0">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Cliente (Opcional)</h3>
                            {!selectedMember ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            value={searchMember}
                                            onChange={(e) => setSearchMember(e.target.value)}
                                            placeholder="Nombre o DNI..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gym-primary transition-all"
                                        />
                                    </div>
                                    {members.length > 0 && (
                                        <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden max-h-40 overflow-y-auto text-sm">
                                            {members.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setSelectedMember(m)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gym-primary hover:text-white transition-all border-b border-white/5 flex flex-col"
                                                >
                                                    <span className="font-bold">{m.firstName} {m.lastName}</span>
                                                    <span className="text-[10px] opacity-70">DNI: {m.dni}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-gym-primary/10 border border-gym-primary/20 p-3 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gym-primary rounded-xl text-white">
                                            <UserIcon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{selectedMember.firstName} {selectedMember.lastName}</p>
                                            <p className="text-[10px] text-gym-primary font-bold">{selectedMember.dni}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMember(null)}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <ShoppingCart size={14} />
                                Carrito ({cart.length})
                            </h3>

                            {cart.length === 0 ? (
                                <div className="py-10 text-center text-gray-600 flex flex-col items-center gap-2 italic text-sm">
                                    <ShoppingCart size={32} strokeWidth={1} />
                                    <p>El carrito está vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-2xl group border border-transparent hover:border-white/10 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white uppercase truncate">{item.name}</p>
                                                <p className="text-[10px] text-gray-500">S/ {Number(item.price).toFixed(2)} c/u</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg text-white"
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg text-white"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Checkout Footer */}
                        <div className="p-6 bg-white/5 border-t border-white/10 shrink-0 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                            {error && (
                                <div className="flex items-start gap-2 text-red-500 text-[10px] font-bold uppercase leading-tight">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Método de Pago</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['CASH', 'CARD', 'YAPE'] as const).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={cn(
                                                "py-2 rounded-xl text-[10px] font-black transition-all border",
                                                paymentMethod === m
                                                    ? "bg-gym-primary border-gym-primary text-white"
                                                    : "bg-black/40 border-white/10 text-gray-500 hover:border-white/30"
                                            )}
                                        >
                                            {m === 'CASH' ? 'EFECTIVO' : m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-gray-500 font-bold text-sm">TOTAL</span>
                                    <span className="text-3xl font-black text-white">S/ {calculateTotal().toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={handleSale}
                                    disabled={loading || cart.length === 0}
                                    className="w-full bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-gym-primary/20 text-lg"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShoppingCart size={20} />
                                            <span>COBRAR AHORA</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SaleReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                sale={lastCreatedSale}
            />
        </div>
    );
};

export default POSPage;
