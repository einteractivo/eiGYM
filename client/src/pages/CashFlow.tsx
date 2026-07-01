import React, { useState, useEffect } from 'react';
import {
    Plus,
    Minus,
    CircleDollarSign,
    Lock,
    Unlock,
    TrendingDown,
    TrendingUp,
    Wallet,
    AlertCircle
} from 'lucide-react';
import type { CashSession } from '../services/CashFlowService';
import CashFlowService from '../services/CashFlowService';
import ProductService, { type Product } from '../services/ProductService';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CashFlow: React.FC = () => {
    const { user } = useAuth();
    const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
    const [history, setHistory] = useState<CashSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'current' | 'history'>('current');

    // Forms
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState<'INCOME' | 'EXPENSE' | null>(null);

    const [initialAmount, setInitialAmount] = useState('');
    const [finalAmount, setFinalAmount] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionCategory, setTransactionCategory] = useState('');
    const [transactionDescription, setTransactionDescription] = useState('');
    const [transactionMethod, setTransactionMethod] = useState('CASH');
    const [notes, setNotes] = useState('');

    // Products for Compras
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [quantity, setQuantity] = useState('1');

    const fetchData = async () => {
        setLoading(true);
        try {
            const session = await CashFlowService.getCurrentSession();
            setCurrentSession(session);
        } catch {
            setCurrentSession(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const data = await CashFlowService.getHistory();
            setHistory(data);
        } catch {
            console.error('Error fetching history');
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await ProductService.getAllProducts('', true);
            setProducts(data);
        } catch {
            console.error('Error fetching products');
        }
    };

    useEffect(() => {
        fetchData();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (view === 'history') {
            fetchHistory();
        }
    }, [view]);

    const handleOpen = async () => {
        if (!user) return;
        try {
            await CashFlowService.openSession({
                userId: user.id,
                initialAmount: parseFloat(initialAmount),
                notes
            });
            setShowOpenModal(false);
            setInitialAmount('');
            setNotes('');
            fetchData();
            window.dispatchEvent(new Event('cashFlowUpdated'));
        } catch {
            alert('Error al abrir la caja');
        }
    };

    const handleClose = async () => {
        if (!currentSession) return;
        try {
            await CashFlowService.closeSession(currentSession.id, {
                finalAmount: parseFloat(finalAmount),
                notes
            });
            setShowCloseModal(false);
            setFinalAmount('');
            setNotes('');
            fetchData();
            window.dispatchEvent(new Event('cashFlowUpdated'));
        } catch {
            alert('Error al cerrar la caja');
        }
    };

    const handleAddTransaction = async () => {
        if (!currentSession || !showTransactionModal) return;
        try {
            await CashFlowService.addTransaction({
                sessionId: currentSession.id,
                amount: parseFloat(transactionAmount),
                type: showTransactionModal,
                category: transactionCategory,
                description: transactionDescription,
                method: transactionMethod
            });
            setShowTransactionModal(null);
            setTransactionAmount('');
            setTransactionMethod('CASH');
            setTransactionCategory('');
            setTransactionDescription('');
            setSelectedProductId('');
            setQuantity('1');
            fetchData();
        } catch {
            alert('Error al registrar la transacción');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-12 transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300">
                <div>
                    
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Control financiero y arqueo diario</p>
                </div>
                <div className="flex bg-gray-50 dark:bg-white/5 p-2 rounded-[1.5rem] border border-gray-200/50 dark:border-white/5 shadow-inner">
                    <button
                        onClick={() => setView('current')}
                        className={`px-8 py-3 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all ${view === 'current'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-gray-300'
                            }`}
                    >
                        Caja Actual
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-8 py-3 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all ${view === 'history'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-gray-300'
                            }`}
                    >
                        Historial
                    </button>
                    {user?.role === 'SUPERADMIN' && (
                        <button
                            onClick={() => {
                                if (window.confirm('¡ATENCIÓN! Esta acción eliminará permanentemente TODOS los registros de ingresos, egresos, ventas y sesiones de caja. El sistema quedará en 0. ¿Está COMPLETAMENTE seguro?')) {
                                    if (window.confirm('¿Desea REALMENTE proceder con el borrado total de datos financieros? Esta acción no se puede deshacer.')) {
                                        CashFlowService.resetCashFlow().then(() => {
                                            alert('Sistema financiero reseteado correctamente.');
                                            window.location.reload();
                                        }).catch(err => {
                                            alert('Error al resetear el sistema: ' + err.message);
                                        });
                                    }
                                }
                            }}
                            className="px-8 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all ml-2 border border-transparent hover:border-red-500/20"
                            title="Resetear todo el sistema financiero a cero"
                        >
                            Resetear Todo
                        </button>
                    )}
                </div>
            </div>

            {view === 'current' ? (
                currentSession ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Session Stats */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-slate-950 transition-all group">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-white/10 text-slate-400 dark:text-gray-500 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-500">
                                            <Unlock size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-gray-500 block">Saldo</span>
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-900 dark:text-white block">Inicial</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                                            S/ {parseFloat(currentSession.initialAmount.toString()).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </h3>
                                        <p className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest italic">
                                            {format(new Date(currentSession.openedAt), 'HH:mm - dd LLL', { locale: es })}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-green-50 dark:hover:shadow-green-900/10 transition-all group">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-100 dark:border-green-500/20 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
                                            <TrendingUp size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-gray-500 block">Total</span>
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-green-600 dark:text-green-400 block">Ingresos</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tighter italic">
                                            S/ {((currentSession.summary?.totalPayments || 0) + (currentSession.summary?.totalManualIncome || 0)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </h3>
                                        <p className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest italic">
                                            Ventas + Manuales
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-red-50 dark:hover:shadow-red-900/10 transition-all group">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-500">
                                            <TrendingDown size={24} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-gray-500 block">Total</span>
                                            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-red-600 dark:text-red-400 block">Egresos</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tighter italic">
                                            S/ {parseFloat((currentSession.summary?.totalManualExpense || 0).toString()).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </h3>
                                        <p className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest italic">
                                            Gastos Registrados
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Expected Balance Card */}
                            <div className="bg-white dark:bg-slate-900 border-2 border-gym-primary/10 dark:border-gym-primary/20 p-10 rounded-[3rem] shadow-xl shadow-orange-500/5 dark:shadow-orange-500/2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform group-hover:opacity-[0.07]">
                                    <Wallet className="text-slate-900 dark:text-white w-48 h-48" strokeWidth={1} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gym-primary/10 rounded-2xl flex items-center justify-center border border-gym-primary/20">
                                                <Wallet className="text-gym-primary w-8 h-8" strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Efectivo en Caja</h3>
                                                <p className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Saldo proyectado para el arqueo</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-6xl font-[1000] text-gym-primary tracking-tighter italic">
                                        S/ {currentSession.summary?.expectedAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            {/* Transactions List */}
                            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm transition-colors duration-300">
                                <div className="p-10 border-b border-gray-50 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-2xl uppercase italic tracking-tight">Movimientos</h3>
                                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-widest mt-1 italic">Detalle de ingresos y egresos</p>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => setShowTransactionModal('INCOME')}
                                            className="flex-1 sm:flex-none justify-center bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all border border-green-100 dark:border-green-500/20 shadow-sm"
                                        >
                                            <Plus className="w-4 h-4 mr-2" strokeWidth={3} /> Ingreso
                                        </button>
                                        <button
                                            onClick={() => setShowTransactionModal('EXPENSE')}
                                            className="flex-1 sm:flex-none justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-500/20 shadow-sm"
                                        >
                                            <Minus className="w-4 h-4 mr-2" strokeWidth={3} /> Egreso
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-[0.2em] bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
                                            <tr>
                                                <th className="px-10 py-6">Tipo</th>
                                                <th className="px-10 py-6">Concepto</th>
                                                <th className="px-10 py-6">Detalle</th>
                                                <th className="px-10 py-6 text-right whitespace-nowrap">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {[
                                                ...(currentSession.transactions || []).map(t => ({ ...t, kind: 'transaction' })),
                                                ...(currentSession.payments || []).map(p => ({
                                                    id: p.id,
                                                    type: 'INCOME',
                                                    category: p.type === 'PRODUCT' ? (p.notes?.startsWith('Venta:') ? p.notes.split(' - ')[0] : 'PRODUCTO') : p.type,
                                                    description: `Pago: ${p.member?.firstName || ''} ${p.member?.lastName || ''} - ${p.notes || ''}`,
                                                    amount: p.amount,
                                                    createdAt: p.date,
                                                    method: p.method,
                                                    kind: 'payment'
                                                }))
                                            ]
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                            .map((t) => (
                                                <tr key={`${t.kind}-${t.id}`} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group">
                                                    <td className="px-10 py-6">
                                                        <span className={cn(
                                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                            t.type === 'INCOME' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20'
                                                        )}>
                                                            {t.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                                            {t.kind === 'payment' && ' (POS)'}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <p className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-tight group-hover:text-gym-primary transition-colors">
                                                            {t.category}
                                                            {t.method && t.method !== 'CASH' && (
                                                                <span className="ml-2 text-[8px] bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500">
                                                                    {t.method}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className="px-10 py-6 text-slate-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest italic">{t.description || '-'}</td>
                                                    <td className={`px-10 py-6 text-right font-black text-lg tracking-tighter italic ${t.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {t.type === 'INCOME' ? '+' : '-'} S/ {parseFloat(t.amount.toString()).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!currentSession.transactions?.length && !currentSession.payments?.length) && (
                                                <tr>
                                                    <td colSpan={4} className="py-24 text-center text-slate-200 dark:text-gray-800">
                                                        <CircleDollarSign size={48} strokeWidth={1} className="mx-auto mb-4 opacity-50" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest italic">No hay movimientos registrados hoy</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-red-50/30 dark:hover:shadow-red-900/10 transition-all group">
                                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mb-8 border border-red-100 dark:border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-all duration-500 text-red-500 shadow-sm">
                                    <Lock size={28} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-slate-900 dark:text-white font-black text-2xl uppercase italic tracking-tight mb-3">Cierre de Caja</h3>
                                <p className="text-slate-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-widest italic mb-10 leading-relaxed">
                                    Finaliza la jornada registrando el arqueo físico. Verifica que los montos coincidan.
                                </p>
                                <button
                                    onClick={() => setShowCloseModal(true)}
                                    className="w-full bg-slate-900 dark:bg-gym-primary hover:bg-slate-800 dark:hover:bg-gym-primary/90 text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-slate-200 dark:shadow-gym-primary/10 active:scale-95 text-xs"
                                >
                                    Realizar Arqueo
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm">
                                <h3 className="text-slate-400 dark:text-gray-500 font-black mb-8 uppercase tracking-[0.3em] text-[10px] italic">Información de Sesión</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-white/5">
                                        <span className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Responsable</span>
                                        <span className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight">{currentSession.user?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Estado</span>
                                        <span className="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100 dark:border-green-500/20 shadow-sm">Activo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center shadow-sm">
                        <div className="w-20 h-20 bg-gym-primary/10 rounded-[2rem] flex items-center justify-center mb-8 border border-gym-primary/20">
                            <Unlock className="text-gym-primary w-10 h-10" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tight">Caja Cerrada</h2>
                        <p className="text-gray-400 dark:text-gray-500 max-w-md mx-auto mb-10 font-bold uppercase text-[11px] tracking-widest italic leading-relaxed">
                            Para comenzar a registrar pagos y transacciones del día, debes realizar la apertura de caja controlando el fondo inicial.
                        </p>
                        <button
                            onClick={() => setShowOpenModal(true)}
                            className="bg-gym-primary text-white font-black px-12 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/20 text-xs uppercase tracking-[0.2em]"
                        >
                            Abrir Caja para Hoy
                        </button>
                    </div>
                )
            ) : (
                /* History View */
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm transition-colors duration-300">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest bg-gray-50/50 dark:bg-white/5">
                            <tr>
                                <th className="px-8 py-5">Apertura</th>
                                <th className="px-8 py-5">Cierre</th>
                                <th className="px-8 py-5">Responsable</th>
                                <th className="px-8 py-5">Fondo Inicial</th>
                                <th className="px-8 py-5">Monto Final</th>
                                <th className="px-8 py-5 text-right">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {history.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                                            {format(new Date(s.openedAt), 'dd/MM/yy HH:mm')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {s.closedAt ? format(new Date(s.closedAt), 'dd/MM/yy HH:mm') : '-'}
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-slate-700 dark:text-gray-300 text-sm font-bold uppercase tracking-tight">{s.user?.name}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-slate-700 dark:text-gray-300 font-bold text-xs">
                                            S/ {parseFloat(s.initialAmount.toString()).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        {s.finalAmount ? (
                                            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded-lg font-bold text-xs">
                                                S/ {parseFloat(s.finalAmount.toString()).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-lg font-bold text-[10px] uppercase">En Curso</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {s.finalAmount && s.expectedAmount ? (
                                            <span className={cn(
                                                "font-black text-sm tracking-tight",
                                                parseFloat(s.finalAmount.toString()) - parseFloat(s.expectedAmount.toString()) === 0
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            )}>
                                                {parseFloat(s.finalAmount.toString()) - parseFloat(s.expectedAmount.toString()) > 0 ? '+' : ''}
                                                S/ {(parseFloat(s.finalAmount.toString()) - parseFloat(s.expectedAmount.toString())).toFixed(2)}
                                            </span>
                                        ) : <span className="text-gray-300 dark:text-gray-700">---</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Apertura */}
            {
                showOpenModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 border border-white/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-gym-primary/10 rounded-2xl flex items-center justify-center border border-gym-primary/20">
                                    <CircleDollarSign className="w-8 h-8 text-gym-primary" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Apertura de Caja</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mt-0.5">Control de fondo inicial</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase text-[10px] tracking-widest ml-1">Fondo Inicial</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 font-bold text-lg">S/</span>
                                        <input
                                            type="number"
                                            value={initialAmount}
                                            onChange={(e) => setInitialAmount(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.25rem] py-4 pl-12 pr-6 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all text-xl font-bold placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase text-[10px] tracking-widest ml-1">Observaciones</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.25rem] py-4 px-6 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all min-h-[120px] font-medium placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                        placeholder="Ej. Cambio de turno, billetes pequeños..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setShowOpenModal(false)}
                                    className="flex-1 px-6 py-4 rounded-[1.25rem] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all font-bold text-sm uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleOpen}
                                    disabled={!initialAmount}
                                    className="flex-1 px-6 py-4 rounded-[1.25rem] bg-gym-primary text-white font-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-orange-500/20 text-sm uppercase tracking-widest"
                                >
                                    Iniciar Jornada
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal Cierre */}
            {
                showCloseModal && currentSession && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-white/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-500/20">
                                    <Lock className="w-8 h-8 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cierre de Caja</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mt-0.5">Finalización de turno</p>
                                </div>
                            </div>
                            <div className="mb-8 p-6 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Saldo calculado:</span>
                                    <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tighter">S/ {currentSession.summary?.expectedAmount.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase text-[10px] tracking-widest ml-1">Monto Físico Actual</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 font-bold text-lg">S/</span>
                                        <input
                                            type="number"
                                            value={finalAmount}
                                            onChange={(e) => setFinalAmount(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.25rem] py-4 pl-12 pr-6 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-red-200 dark:focus:border-red-500/30 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-500/5 transition-all font-black text-2xl placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                {finalAmount && (
                                    <div className={cn(
                                        "p-4 rounded-[1.25rem] text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                                        parseFloat(finalAmount) === currentSession.summary?.expectedAmount
                                            ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                                            : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                    )}>
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        {parseFloat(finalAmount) === currentSession.summary?.expectedAmount
                                            ? '¡Todo cuadra perfectamente!'
                                            : `Diferencia detectada: S/ ${(parseFloat(finalAmount) - (currentSession.summary?.expectedAmount || 0)).toFixed(2)}`}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase text-[10px] tracking-widest ml-1">Observaciones Finales</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.25rem] py-4 px-6 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-red-200 dark:focus:border-red-500/30 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-500/5 transition-all min-h-[100px] font-medium placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                        placeholder="Notas de cierre..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setShowCloseModal(false)}
                                    className="flex-1 px-6 py-4 rounded-[1.25rem] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all font-bold text-sm uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={!finalAmount}
                                    className="flex-1 px-6 py-4 rounded-[1.25rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black hover:bg-slate-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 shadow-xl shadow-slate-200 dark:shadow-none text-sm uppercase tracking-widest"
                                >
                                    Cerrar Caja
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal Manual Transaction (Income/Expense) */}
            {
                showTransactionModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-10 border border-white/5">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">
                                Registrar {showTransactionModal === 'INCOME' ? 'Ingreso' : 'Gasto'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-10 italic">Flujo de caja manual</p>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-gray-500 dark:text-gray-400 mb-3 font-bold uppercase text-[10px] tracking-widest ml-1">Categoría</label>
                                        <select
                                            value={transactionCategory}
                                            onChange={(e) => setTransactionCategory(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.25rem] py-4 px-6 text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="" className="dark:bg-slate-900">Seleccionar...</option>
                                            {showTransactionModal === 'INCOME' ? (
                                                <>
                                                    <option value="INGRESO EXTRAORDINARIO" className="dark:bg-slate-900">Ingreso Extradinario</option>
                                                    <option value="VENTA PRODUCTO" className="dark:bg-slate-900">Venta Manual de Producto</option>
                                                    <option value="OTROS" className="dark:bg-slate-900">Otros</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="SUELDOS" className="dark:bg-slate-900">Sueldos / Personal</option>
                                                    <option value="SERVICIOS" className="dark:bg-slate-900">Servicios (Agua, Luz, Internet)</option>
                                                    <option value="ALQUILER" className="dark:bg-slate-900">Alquiler</option>
                                                    <option value="COMPRAS" className="dark:bg-slate-900">Compras / Proveedores</option>
                                                    <option value="MANTENIMIENTO" className="dark:bg-slate-900">Mantenimiento</option>
                                                    <option value="IMPREVISTOS" className="dark:bg-slate-900">Imprevistos</option>
                                                    <option value="OTROS" className="dark:bg-slate-900">Otros</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-500 dark:text-gray-400 mb-3 font-bold uppercase text-[10px] tracking-widest ml-1">Importe</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 font-bold text-lg">S/</span>
                                            <input
                                                type="number"
                                                value={transactionAmount}
                                                onChange={(e) => setTransactionAmount(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.25rem] py-4 pl-12 pr-6 text-slate-900 dark:text-white font-black text-xl focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {(transactionCategory === 'COMPRAS' || (showTransactionModal === 'INCOME' && transactionCategory === 'VENTA PRODUCTO')) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10 animate-in slide-in-from-top-4 duration-300">
                                        <div>
                                            <label className="block text-gray-500 dark:text-gray-400 mb-3 font-bold uppercase text-[10px] tracking-widest ml-1">Seleccionar Producto</label>
                                            <select
                                                value={selectedProductId}
                                                onChange={(e) => {
                                                    const prodId = e.target.value;
                                                    setSelectedProductId(prodId);
                                                    const product = products.find(p => p.id === parseInt(prodId));
                                                    if (product) {
                                                        const q = parseInt(quantity) || 1;
                                                        const price = showTransactionModal === 'INCOME' ? product.price : product.costPrice;
                                                        setTransactionAmount((price * q).toString());
                                                        setTransactionDescription(`${showTransactionModal === 'INCOME' ? 'Venta' : 'Compra'} de producto: ${product.name} (${q} uds)`);
                                                    }
                                                }}
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-transparent rounded-[1.25rem] py-4 px-6 text-slate-900 dark:text-white font-bold focus:border-gym-primary/30 outline-none appearance-none cursor-pointer text-sm"
                                            >
                                                <option value="">Elegir producto...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (S/ {p.costPrice})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 dark:text-gray-400 mb-3 font-bold uppercase text-[10px] tracking-widest ml-1">Cantidad</label>
                                            <input
                                                type="number"
                                                value={quantity}
                                                min="1"
                                                onChange={(e) => {
                                                    const q = e.target.value;
                                                    setQuantity(q);
                                                    const product = products.find(p => p.id === parseInt(selectedProductId));
                                                    if (product) {
                                                        const qInt = parseInt(q) || 0;
                                                        const price = showTransactionModal === 'INCOME' ? product.price : product.costPrice;
                                                        setTransactionAmount((price * qInt).toString());
                                                        setTransactionDescription(`${showTransactionModal === 'INCOME' ? 'Venta' : 'Compra'} de producto: ${product.name} (${qInt} uds)`);
                                                    }
                                                }}
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-transparent rounded-[1.25rem] py-4 px-6 text-slate-900 dark:text-white font-black text-xl focus:border-gym-primary/30 outline-none"
                                                placeholder="1"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-gray-500 dark:text-gray-400 mb-3 font-bold uppercase text-[10px] tracking-widest ml-1">Método de Pago</label>
                                        <select
                                            value={transactionMethod}
                                            onChange={(e) => setTransactionMethod(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.25rem] py-4 px-6 text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 outline-none appearance-none cursor-pointer uppercase text-xs tracking-widest"
                                        >
                                            <option value="CASH" className="dark:bg-slate-900">Efectivo 💵</option>
                                            <option value="CARD" className="dark:bg-slate-900">Tarjeta 💳</option>
                                            <option value="TRANSFER" className="dark:bg-slate-900">Transferencia 🏦</option>
                                            <option value="YAPE" className="dark:bg-slate-900">Yape 📱</option>
                                            <option value="PLIN" className="dark:bg-slate-900">Plin 📱</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-500 dark:text-gray-400 mb-3 font-bold uppercase text-[10px] tracking-widest ml-1">Descripción del Concepto</label>
                                    <textarea
                                        value={transactionDescription}
                                        onChange={(e) => setTransactionDescription(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] py-5 px-6 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 outline-none h-32 font-medium placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                        placeholder="Especificar detalles..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-12">
                                <button
                                    onClick={() => setShowTransactionModal(null)}
                                    className="flex-1 px-8 py-5 rounded-[1.5rem] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all font-bold text-sm uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddTransaction}
                                    disabled={!transactionAmount || !transactionCategory}
                                    className={`flex-1 px-8 py-5 rounded-[1.5rem] font-black text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm uppercase tracking-widest shadow-xl ${showTransactionModal === 'INCOME'
                                        ? 'bg-green-500 shadow-green-500/10 hover:bg-green-600'
                                        : 'bg-red-500 shadow-red-500/10 hover:bg-red-600'
                                        }`}
                                >
                                    Guardar {showTransactionModal === 'INCOME' ? 'Ingreso' : 'Gasto'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CashFlow;
