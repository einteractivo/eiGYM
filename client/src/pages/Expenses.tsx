import React, { useEffect, useState } from 'react';
import { TrendingDown, Calendar, Trash2, Ban, AlertCircle } from 'lucide-react';
import type { CashTransaction } from '../services/CashFlowService';
import CashFlowService from '../services/CashFlowService';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Expenses: React.FC = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<CashTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        try {
            const data = await CashFlowService.getAllTransactions('EXPENSE');
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleVoid = async (id: number) => {
        if (!confirm('¿Estás seguro de anular este egreso? El monto ya no se restará del total de la caja.')) return;
        try {
            await CashFlowService.voidTransaction(id);
            fetchExpenses();
        } catch (error) {
            alert('Error al anular el egreso');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar permanentemente este registro?')) return;
        try {
            await CashFlowService.deleteTransaction(id);
            fetchExpenses();
        } catch (error) {
            alert('Error al eliminar el egreso');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Egresos</h1>
                    <p className="text-gray-400 mt-1">Historial de gastos y egresos manuales</p>
                </div>
            </div>

            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                                <th className="p-6 font-semibold">Fecha</th>
                                <th className="p-6 font-semibold">Categoría</th>
                                <th className="p-6 font-semibold">Descripción</th>
                                <th className="p-6 font-semibold">Caja (Responsable)</th>
                                <th className="p-6 font-semibold text-right">Monto</th>
                                {['ADMIN', 'SUPERADMIN'].includes(user?.role || '') && (
                                    <th className="p-6 font-semibold text-right">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {expenses.map((expense) => (
                                <tr key={expense.id} className={`hover:bg-white/5 transition-colors ${expense.status === 'VOIDED' ? 'opacity-50' : ''}`}>
                                    <td className="p-6 text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-500" />
                                            {format(new Date(expense.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase w-fit">
                                                {expense.category}
                                            </span>
                                            {expense.status === 'VOIDED' && (
                                                <span className="text-[10px] font-black uppercase text-red-500 tracking-tighter flex items-center gap-1">
                                                    <AlertCircle size={10} /> ANULADO
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6 text-gray-400 text-sm">
                                        {expense.description || '-'}
                                    </td>
                                    <td className="p-6 text-gray-400 text-sm">
                                        Caja #{expense.sessionId} ({(expense as any).session?.user?.name})
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className={`font-bold text-lg ${expense.status === 'VOIDED' ? 'text-gray-500 line-through' : 'text-red-400'}`}>
                                            - S/ {parseFloat(expense.amount.toString()).toFixed(2)}
                                        </span>
                                    </td>
                                    {['ADMIN', 'SUPERADMIN'].includes(user?.role || '') && (
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {expense.status !== 'VOIDED' && (
                                                    <button
                                                        onClick={() => handleVoid(expense.id)}
                                                        className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors"
                                                        title="Anular Egreso"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {expenses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500 italic">
                                        No hay egresos registrados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gym-dark-lighter p-6 rounded-2xl border border-white/5 flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                    <TrendingDown className="text-blue-400 w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">Nota sobre Egresos</h4>
                    <p className="text-sm text-gray-400">
                        Los egresos se registran manualmente desde la sección de <strong>Caja</strong> durante la jornada diaria. Esta vista muestra un historial consolidado de todos los gastos registrados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
