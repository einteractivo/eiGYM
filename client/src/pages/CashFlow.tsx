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
import { useAuth } from '../contexts/AuthContext';
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
    const [notes, setNotes] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const session = await CashFlowService.getCurrentSession();
            setCurrentSession(session);
        } catch (error) {
            setCurrentSession(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const data = await CashFlowService.getHistory();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    useEffect(() => {
        fetchData();
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
        } catch (error) {
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
        } catch (error) {
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
                description: transactionDescription
            });
            setShowTransactionModal(null);
            setTransactionAmount('');
            setTransactionCategory('');
            setTransactionDescription('');
            fetchData();
        } catch (error) {
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Flujo de Caja</h1>
                <div className="flex space-x-2 bg-gym-dark-lighter p-1 rounded-lg">
                    <button
                        onClick={() => setView('current')}
                        className={`px-4 py-2 rounded-md transition-all ${view === 'current'
                            ? 'bg-gym-primary text-gym-dark font-medium'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Caja Actual
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-4 py-2 rounded-md transition-all ${view === 'history'
                            ? 'bg-gym-primary text-gym-dark font-medium'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {view === 'current' ? (
                currentSession ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Session Stats */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gym-dark-lighter p-6 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Apertura</span>
                                        <Unlock className="text-blue-400 w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        S/ {parseFloat(currentSession.initialAmount.toString()).toFixed(2)}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                        {format(new Date(currentSession.openedAt), 'HH:mm - dd MMM', { locale: es })}
                                    </div>
                                </div>

                                <div className="bg-gym-dark-lighter p-6 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Ingresos Totales</span>
                                        <TrendingUp className="text-green-400 w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-green-400">
                                        S/ {(currentSession.summary?.totalPayments || 0 + (currentSession.summary?.totalManualIncome || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                        Incluye membresías y manuales
                                    </div>
                                </div>

                                <div className="bg-gym-dark-lighter p-6 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Egresos Totales</span>
                                        <TrendingDown className="text-red-400 w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-red-400">
                                        S/ {(currentSession.summary?.totalManualExpense || 0).toFixed(2)}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">
                                        Gastos manuales registrados
                                    </div>
                                </div>
                            </div>

                            {/* Expected Balance Card */}
                            <div className="bg-gym-primary/10 border border-gym-primary/20 p-6 rounded-xl">
                                <div className="flex items-center space-x-3 mb-4">
                                    <Wallet className="text-gym-primary w-6 h-6" />
                                    <h3 className="text-lg font-semibold text-white">Saldo Esperado en Caja</h3>
                                </div>
                                <div className="text-4xl font-black text-gym-primary">
                                    S/ {currentSession.summary?.expectedAmount.toFixed(2)}
                                </div>
                                <p className="text-gray-400 mt-2 text-sm italic">
                                    Este monto es la suma del fondo inicial + ingresos - egresos.
                                </p>
                            </div>

                            {/* Transactions List */}
                            <div className="bg-gym-dark-lighter rounded-xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                    <h3 className="font-semibold text-white">Transacciones Recientes</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setShowTransactionModal('INCOME')}
                                            className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm flex items-center hover:bg-green-500/30 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Ingreso
                                        </button>
                                        <button
                                            onClick={() => setShowTransactionModal('EXPENSE')}
                                            className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm flex items-center hover:bg-red-500/30 transition-colors"
                                        >
                                            <Minus className="w-4 h-4 mr-1" /> Egreso
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-xs text-gray-400 uppercase bg-black/20">
                                            <tr>
                                                <th className="px-6 py-3">Tipo</th>
                                                <th className="px-6 py-3">Categoría</th>
                                                <th className="px-6 py-3">Descripción</th>
                                                <th className="px-6 py-3 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {/* Manual Transactions */}
                                            {currentSession.transactions?.map((t) => (
                                                <tr key={`t-${t.id}`} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs ${t.type === 'INCOME' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                            {t.type === 'INCOME' ? 'Manual' : 'Gasto'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-white text-sm">{t.category}</td>
                                                    <td className="px-6 py-4 text-gray-400 text-sm">{t.description || '-'}</td>
                                                    <td className={`px-6 py-4 text-right font-medium ${t.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                        {t.type === 'INCOME' ? '+' : '-'} S/ {parseFloat(t.amount.toString()).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Automatic Payments */}
                                            {currentSession.payments?.map((p) => (
                                                <tr key={`p-${p.id}`} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400">
                                                            Automático
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-white text-sm">{p.type}</td>
                                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                                        Pago de {p.member?.firstName} {p.member?.lastName}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-green-400">
                                                        + S/ {parseFloat(p.amount.toString()).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-6">
                            <div className="bg-gym-dark-lighter p-6 rounded-xl border border-white/5">
                                <h3 className="text-white font-semibold mb-4 flex items-center">
                                    <Lock className="w-5 h-5 mr-2 text-red-500" />
                                    Cierre de Caja
                                </h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    Finaliza la jornada actual registrando el monto real existente en caja.
                                </p>
                                <button
                                    onClick={() => setShowCloseModal(true)}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
                                >
                                    Cerrar Caja
                                </button>
                            </div>

                            <div className="bg-gym-dark-lighter p-6 rounded-xl border border-white/5">
                                <h3 className="text-white font-semibold mb-3">Información</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Usuario:</span>
                                        <span className="text-white">{currentSession.user?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Estado:</span>
                                        <span className="text-gym-primary">Abierta</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gym-dark-lighter p-12 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gym-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Unlock className="text-gym-primary w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Caja Cerrada</h2>
                        <p className="text-gray-400 max-w-md mx-auto mb-8">
                            Para comenzar a registrar pagos y transacciones del día, debes realizar la apertura de caja.
                        </p>
                        <button
                            onClick={() => setShowOpenModal(true)}
                            className="bg-gym-primary text-gym-dark font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all shadow-xl shadow-gym-primary/20"
                        >
                            Abrir Caja para Hoy
                        </button>
                    </div>
                )
            ) : (
                /* History View */
                <div className="bg-gym-dark-lighter rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-black/20">
                            <tr>
                                <th className="px-6 py-3">Apertura</th>
                                <th className="px-6 py-3">Cierre</th>
                                <th className="px-6 py-3">Responsable</th>
                                <th className="px-6 py-3">Inicial</th>
                                <th className="px-6 py-3">Final</th>
                                <th className="px-6 py-3 text-right">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((s) => (
                                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-sm text-white">
                                        {format(new Date(s.openedAt), 'dd/MM/yy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {s.closedAt ? format(new Date(s.closedAt), 'dd/MM/yy HH:mm') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">{s.user?.name}</td>
                                    <td className="px-6 py-4 text-sm text-white">S/ {parseFloat(s.initialAmount.toString()).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-white">
                                        {s.finalAmount ? `S/ ${parseFloat(s.finalAmount.toString()).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {s.finalAmount && s.expectedAmount ? (
                                            <span className={`font-medium ${parseFloat(s.finalAmount.toString()) - parseFloat(s.expectedAmount.toString()) === 0
                                                ? 'text-green-400'
                                                : 'text-red-400'
                                                }`}>
                                                S/ {(parseFloat(s.finalAmount.toString()) - parseFloat(s.expectedAmount.toString())).toFixed(2)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Apertura */}
            {showOpenModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gym-dark-lighter border border-white/10 w-full max-w-md rounded-2xl shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <CircleDollarSign className="w-6 h-6 mr-2 text-gym-primary" />
                                Apertura de Caja
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <label className="block text-gray-400 mb-2 font-medium">Monto Inicial (Fondo)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                                        <input
                                            type="number"
                                            value={initialAmount}
                                            onChange={(e) => setInitialAmount(e.target.value)}
                                            className="w-full bg-gym-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-gym-primary outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 font-medium">Notas / Observaciones</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-gym-dark border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-gym-primary outline-none min-h-[100px]"
                                        placeholder="Ej. Cambio de turno, billetes pequeños..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowOpenModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleOpen}
                                    disabled={!initialAmount}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gym-primary text-gym-dark font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    Confirmar Apertura
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cierre */}
            {showCloseModal && currentSession && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gym-dark-lighter border border-white/10 w-full max-w-md rounded-2xl shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <Lock className="w-6 h-6 mr-2 text-red-500" />
                                Cierre de Caja
                            </h3>
                            <div className="mb-6 p-4 bg-gym-dark rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-400 text-sm">Saldo del Sistema:</span>
                                    <span className="text-white font-bold">S/ {currentSession.summary?.expectedAmount.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 mb-2 font-medium">Monto Real en Caja (Físico)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                                        <input
                                            type="number"
                                            value={finalAmount}
                                            onChange={(e) => setFinalAmount(e.target.value)}
                                            className="w-full bg-gym-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-gym-primary outline-none font-bold text-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                {finalAmount && (
                                    <div className={`p-3 rounded-lg text-sm flex items-center ${parseFloat(finalAmount) === currentSession.summary?.expectedAmount
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        {parseFloat(finalAmount) === currentSession.summary?.expectedAmount
                                            ? 'El balance cuadra perfectamente.'
                                            : `Hay una diferencia de S/ ${(parseFloat(finalAmount) - (currentSession.summary?.expectedAmount || 0)).toFixed(2)}`}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-gray-400 mb-2 font-medium">Notas Finales</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-gym-dark border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-gym-primary outline-none min-h-[100px]"
                                        placeholder="Observaciones sobre el cierre..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowCloseModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={!finalAmount}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                                >
                                    Confirmar Cierre
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Manual Transaction (Income/Expense) */}
            {showTransactionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gym-dark-lighter border border-white/10 w-full max-w-md rounded-2xl shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-6">
                                Registar {showTransactionModal === 'INCOME' ? 'Ingreso' : 'Egreso'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Categoría</label>
                                    <select
                                        value={transactionCategory}
                                        onChange={(e) => setTransactionCategory(e.target.value)}
                                        className="w-full bg-gym-dark border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-gym-primary outline-none"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {showTransactionModal === 'INCOME' ? (
                                            <>
                                                <option value="INGRESO EXTRAORDINARIO">Ingreso Extraordinario</option>
                                                <option value="OTROS">Otros</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="SUELDOS">Sueldos / Personal</option>
                                                <option value="SERVICIOS">Servicios (Agua, Luz, Internet)</option>
                                                <option value="ALQUILER">Alquiler</option>
                                                <option value="COMPRAS">Compras / Proveedores</option>
                                                <option value="MANTENIMIENTO">Mantenimiento</option>
                                                <option value="IMPREVISTOS">Imprevistos</option>
                                                <option value="OTROS">Otros</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Monto</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                                        <input
                                            type="number"
                                            value={transactionAmount}
                                            onChange={(e) => setTransactionAmount(e.target.value)}
                                            className="w-full bg-gym-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-gym-primary outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Descripción</label>
                                    <textarea
                                        value={transactionDescription}
                                        onChange={(e) => setTransactionDescription(e.target.value)}
                                        className="w-full bg-gym-dark border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-gym-primary outline-none h-24"
                                        placeholder="Detalles de la transacción..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowTransactionModal(null)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddTransaction}
                                    disabled={!transactionAmount || !transactionCategory}
                                    className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${showTransactionModal === 'INCOME'
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                >
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashFlow;
