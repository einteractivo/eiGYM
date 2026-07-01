import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Trash2, User as UserIcon, AlertCircle, CheckCircle2, X } from 'lucide-react';
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
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [applyIgv, setApplyIgv] = useState(false);
    const [amountReceived, setAmountReceived] = useState<number>(0);

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

    const calculateSubtotal = () => {
        return cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return applyIgv ? subtotal * 1.18 : subtotal;
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
                    price: applyIgv ? Number(item.price) * 1.18 : Number(item.price)
                })),
                paymentMethod,
                total: calculateTotal()
            });

            const enrichedSale = {
                ...result,
                amountReceived: paymentMethod === 'CASH' ? amountReceived : result.total,
                change: paymentMethod === 'CASH' ? Math.max(0, amountReceived - calculateTotal()) : 0
            };

            setSuccess(true);
            setLastCreatedSale(enrichedSale);
            setIsCheckoutModalOpen(false);
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
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-8 transition-colors duration-300 min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)]">
            {success && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-4 py-2 rounded-2xl border border-green-100 dark:border-green-500/20 animate-in zoom-in-95 font-black text-xs uppercase tracking-widest shadow-xl">
                    <CheckCircle2 size={16} />
                    <span>Venta Exitosa</span>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                <div className="flex-1 flex flex-col gap-8 min-h-0">
                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 flex-1 flex flex-col min-h-0 shadow-sm relative overflow-hidden group transition-colors duration-300">
                        <div className="relative mb-8 shrink-0">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={24} />
                            <input
                                type="text"
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                placeholder="Buscar productos..."
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] py-5 pl-16 pr-6 text-xl text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-8 focus:ring-gym-primary/5 transition-all font-black"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
                            {products.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={cn(
                                        "p-5 rounded-[2rem] border transition-all text-left flex flex-col justify-between group h-max relative",
                                        product.stock <= 0
                                            ? "bg-gray-50 border-gray-100 opacity-50 grayscale cursor-not-allowed"
                                            : "bg-white border-gray-100 hover:border-gym-primary/30 hover:shadow-xl hover:shadow-gym-primary/5 hover:-translate-y-1"
                                    )}
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <p className="font-extrabold text-slate-900 dark:text-white uppercase text-sm tracking-tight mb-1 group-hover:text-gym-primary transition-colors">{product.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">{product.description || 'Sin descripción detallada'}</p>
                                            </div>
                                            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded-xl shrink-0 text-right shadow-sm border border-transparent dark:border-gray-200">
                                                <span className="text-[10px] font-black uppercase tracking-widest block opacity-50 leading-none mb-1">Precio</span>
                                                <span className="font-extrabold text-sm leading-none">S/ {Number(product.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                                        <span className={cn(
                                            "px-2 py-1 rounded-lg border",
                                            product.stock <= 5 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20" : "text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10"
                                        )}>
                                            STK: {product.stock}
                                        </span>
                                        <span className="bg-gym-primary text-white p-2 rounded-xl scale-0 group-hover:scale-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            AGREGAR
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart and Checkout Area */}
                <div className="w-full lg:w-[420px] flex flex-col gap-8 shrink-0 min-h-0">
                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] flex flex-col min-h-0 shadow-2xl relative overflow-hidden transition-colors duration-300">
                        {/* Member Selection */}
                        <div className="p-8 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 shrink-0">
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">IDENTIFICAR CLIENTE</h3>
                            {!selectedMember ? (
                                <div className="space-y-4 relative">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={searchMember}
                                            onChange={(e) => setSearchMember(e.target.value)}
                                            placeholder="Nombre o DNI..."
                                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-[1.25rem] py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/10 focus:border-gym-primary/50 transition-all font-bold"
                                        />
                                    </div>
                                    {members.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-[1.5rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                                {members.map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => {
                                                            setSelectedMember(m);
                                                            setMembers([]);
                                                            setSearchMember('');
                                                        }}
                                                        className="w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50 dark:border-white/10 last:border-0 transition-all flex flex-col group"
                                                    >
                                                        <span className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-tight group-hover:text-gym-primary transition-colors">{m.firstName} {m.lastName}</span>
                                                        <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 tracking-widest mt-0.5">{m.dni}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-gym-primary/5 dark:bg-gym-primary/10 border-2 border-gym-primary/20 p-4 rounded-[1.5rem] animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gym-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gym-primary/20">
                                            <UserIcon size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{selectedMember.firstName} {selectedMember.lastName}</p>
                                            <p className="text-[10px] text-gym-primary font-black tracking-[0.2em] mt-1 uppercase">DNI {selectedMember.dni}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMember(null)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ShoppingCart size={14} />
                                    CARRITO ({cart.reduce((s, i) => s + i.quantity, 0)})
                                </h3>
                                {cart.length > 0 && (
                                    <button onClick={() => setCart([])} className="text-[9px] font-black uppercase text-red-400 hover:text-red-600 tracking-widest transition-colors">VACIAR</button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div className="py-20 text-center text-gray-300 dark:text-gray-700 flex flex-col items-center gap-6 animate-in fade-in">
                                    <div className="w-20 h-20 rounded-[2rem] bg-gray-50 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5">
                                        <ShoppingCart size={32} strokeWidth={1} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em]">El carrito está vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-4 items-center bg-gray-50 dark:bg-white/5 p-4 rounded-[1.5rem] group border border-transparent hover:border-gray-100 dark:hover:border-white/10 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-slate-950 transition-all animate-in slide-in-from-right-4 duration-300">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{item.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 tracking-tight">S/ {Number(item.price).toFixed(2)} / unidad</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-xl p-1.5 shadow-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors font-black text-lg"
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-black w-6 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors font-black text-lg"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Checkout Footer */}
                        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] relative z-10 transition-colors duration-300">
                            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                                <div className="w-full lg:w-auto flex justify-between lg:justify-start items-center gap-6">
                                    <div>
                                        <span className="text-[8px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-[0.3em] block mb-0.5">Total a Pagar</span>
                                        <span className="text-2xl font-black text-white leading-none tracking-tighter italic">
                                            <span className="text-gym-primary mr-1">S/</span>
                                            {calculateTotal().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-right lg:text-left">
                                        <span className="text-[8px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-[0.3em] block mb-0.5">Impuestos</span>
                                        <span className="text-xs font-bold text-white/50 tracking-tighter italic leading-none">{applyIgv ? "IGV (+18%)" : "Sin IGV"}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCheckoutModalOpen(true);
                                        setAmountReceived(0);
                                    }}
                                    disabled={cart.length === 0}
                                    className="w-full lg:w-auto bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gym-primary/20 text-sm tracking-widest group active:scale-[0.98] shrink-0"
                                >
                                    <ShoppingCart size={16} className="group-hover:animate-bounce" />
                                    <span>PAGAR</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-[3rem] w-full max-w-md shadow-[0_20px_70px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/10">
                        <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b border-white/5">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Confirmar Pago</h2>
                            <button
                                onClick={() => setIsCheckoutModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-white/10 rounded-2xl"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {error && (
                                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-in shake duration-300">
                                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-[10px] font-black uppercase text-red-500 tracking-tight leading-none">{error}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">MÉTODO DE PAGO</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['CASH', 'CARD', 'YAPE'] as const).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={cn(
                                                "py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border-2",
                                                paymentMethod === m
                                                    ? "bg-gym-primary border-gym-primary text-white shadow-lg shadow-gym-primary/20"
                                                    : "bg-slate-800 border-slate-800 text-slate-500 hover:border-slate-700"
                                            )}
                                        >
                                            {m === 'CASH' ? 'EFECTIVO' : m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">IMPUESTOS (IGV 18%)</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setApplyIgv(false)}
                                        className={cn(
                                            "py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border-2",
                                            !applyIgv
                                                ? "bg-gym-primary border-gym-primary text-white shadow-lg shadow-gym-primary/20"
                                                : "bg-slate-800 border-slate-800 text-slate-500 hover:border-slate-700"
                                        )}
                                    >
                                        SIN IGV
                                    </button>
                                    <button
                                        onClick={() => setApplyIgv(true)}
                                        className={cn(
                                            "py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border-2",
                                            applyIgv
                                                ? "bg-gym-primary border-gym-primary text-white shadow-lg shadow-gym-primary/20"
                                                : "bg-slate-800 border-slate-800 text-slate-500 hover:border-slate-700"
                                        )}
                                    >
                                        CON IGV (+18%)
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'CASH' && (
                                <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">RECIBIDO</h3>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gym-primary font-black">S/</span>
                                                <input
                                                    type="number"
                                                    value={amountReceived || ''}
                                                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="0.00"
                                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl py-4 pl-10 pr-4 text-xl text-white font-black focus:border-gym-primary/50 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">VUELTO</h3>
                                            <div className="bg-slate-800/50 border-2 border-dashed border-white/5 rounded-xl py-4 px-4 flex items-center justify-between">
                                                <span className="text-gym-primary font-black">S/</span>
                                                <span className={cn(
                                                    "text-2xl font-black",
                                                    (amountReceived - calculateTotal()) > 0 ? "text-green-400" : "text-white/20"
                                                )}>
                                                    {Math.max(0, amountReceived - calculateTotal()).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">Total a Pagar</span>
                                        <span className="text-4xl font-black text-white leading-none tracking-tighter italic">
                                            <span className="text-gym-primary mr-2">S/</span>
                                            {calculateTotal().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">Impuestos</span>
                                        <span className="text-sm font-bold text-white/50 tracking-tighter italic leading-none">{applyIgv ? "IGV (+18%)" : "Sin IGV"}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSale}
                                    disabled={loading || cart.length === 0}
                                    className="w-full bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-20 disabled:grayscale text-white font-black py-6 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-gym-primary/20 text-xl tracking-widest group active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShoppingCart size={24} className="group-hover:animate-bounce" />
                                            <span>COBRAR VENTA</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SaleReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                sale={lastCreatedSale}
            />
        </div>
    );
};

export default POSPage;
