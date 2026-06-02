import React, { useEffect, useState } from 'react';
import { TrendingDown, Calendar, Trash2, Ban, AlertCircle } from 'lucide-react';
import type { CashTransaction } from '../services/CashFlowService';
import CashFlowService from '../services/CashFlowService';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

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
        } catch {
            alert('Error al anular el egreso');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar permanentemente este registro?')) return;
        try {
            await CashFlowService.deleteTransaction(id);
            fetchExpenses();
        } catch {
            alert('Error al eliminar el egreso');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 transition-colors">
            <div className="flex flex-col sm:flex-row shadow-sm sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 transition-colors">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Egresos de <span className="text-red-500">Caja</span></h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Registro histórico de gastos y salidas de caja</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm shadow-gray-100 dark:shadow-none transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5 text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-[0.2em] bg-gray-50/50 dark:bg-white/5 transition-colors">
                                <th className="px-8 py-6">Fecha y Hora</th>
                                <th className="px-8 py-6">Categoría</th>
                                <th className="px-8 py-6">Descripción del Gasto</th>
                                <th className="px-8 py-6">Control de Caja</th>
                                <th className="px-8 py-6 text-right">Monto Retirado</th>
                                {['ADMIN', 'SUPERADMIN'].includes(user?.role || '') && (
                                    <th className="px-8 py-6 text-right">Gestión</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                            {expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 dark:text-gray-500 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 group-hover:text-red-500 transition-all">
                                                <Calendar size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{format(new Date(expense.createdAt), 'dd/MM/yyyy', { locale: es })}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{format(new Date(expense.createdAt), 'HH:mm', { locale: es })} hrs</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-500 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest w-fit">
                                                {expense.category}
                                            </span>
                                            {expense.status === 'VOIDED' && (
                                                <span className="text-[8px] font-black uppercase text-red-400 tracking-[0.2em] flex items-center gap-1 mt-1">
                                                    <AlertCircle size={10} strokeWidth={3} /> ANULADO
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-slate-600 dark:text-gray-400 tracking-tight max-w-xs">{expense.description || '-'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-gray-500">
                                                #{expense.sessionId}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">{(expense as any).session?.user?.name || 'Sistema'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className={expense.status === 'VOIDED' ? 'opacity-30' : ''}>
                                            <span className={cn(
                                                "text-xl font-black italic tracking-tighter",
                                                expense.status === 'VOIDED' ? "text-slate-400 dark:text-gray-600 line-through decoration-red-500/50 decoration-2" : "text-slate-900 dark:text-white"
                                            )}>
                                                <span className="text-red-500 text-xs not-italic mr-1">- S/</span>
                                                {parseFloat(expense.amount.toString()).toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                    {['ADMIN', 'SUPERADMIN'].includes(user?.role || '') && (
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                {expense.status !== 'VOIDED' && (
                                                    <button
                                                        onClick={() => handleVoid(expense.id)}
                                                        className="w-10 h-10 flex items-center justify-center bg-orange-50 dark:bg-orange-500/10 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500 rounded-xl transition-all border border-orange-100 dark:border-orange-500/20 shadow-sm hover:text-white"
                                                        title="Anular Egreso"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 rounded-xl transition-all border border-red-100 dark:border-red-500/20 shadow-sm hover:text-white"
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
                                    <td colSpan={6} className="px-8 py-32 text-center text-gray-300 dark:text-gray-800 transition-colors">
                                        <div className="flex flex-col items-center gap-4">
                                            <Ban size={48} className="text-gray-100 dark:text-gray-800" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em] italic">No hay registros de salida</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 flex items-start gap-6 shadow-sm shadow-gray-100 dark:shadow-none transition-colors">
                <div className="p-4 bg-slate-900 dark:bg-gym-primary rounded-[1.5rem] shadow-xl shadow-slate-200 dark:shadow-none transition-colors">
                    <TrendingDown className="text-white dark:text-slate-900 w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Control y Transparencia</h4>
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Los egresos se registran obligatoriamente desde la sección de <strong className="text-slate-900 dark:text-white font-black">Flujo de Caja</strong> por el responsable de turno. Esta vista consolida históricamente todas las salidas de capital para auditoría.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
