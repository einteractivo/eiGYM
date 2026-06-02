import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2, Ban, CircleDollarSign, TrendingDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format, isSameDay, isSameMonth, parseISO } from 'date-fns';

import api from '../services/api';
import PaymentModal from '../components/PaymentModal';
import { cn } from '../lib/utils';

interface Payment {
    id: number;
    amount: string;
    method: string;
    type: string;
    date: string;
    notes: string;
    member?: {
        firstName: string;
        lastName: string;
        dni: string;
    };
    status: 'COMPLETED' | 'VOIDED';
}

const Payments: React.FC = () => {
    useAuth();
    const navigate = useNavigate();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'all' | 'day' | 'month'>('all');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/payments');
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleSuccess = () => {
        fetchPayments();
    };

    const handleVoid = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas anular este pago? Esta acción no se puede deshacer.')) return;
        try {
            await api.put(`/payments/${id}/void`);
            fetchPayments();
        } catch (error) {
            console.error('Error voiding payment:', error);
            alert('Error al anular el pago');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿ELIMINAR PERMANENTEMENTE? Esta acción borrará el registro de la base de datos.')) return;
        try {
            await api.delete(`/payments/${id}`);
            fetchPayments();
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Error al eliminar el pago');
        }
    };

    const filteredPayments = payments.filter((p: Payment) => {
        if (viewMode === 'all') return true;
        const pDate = parseISO(p.date || '');
        if (viewMode === 'day') return isSameDay(pDate, selectedDate);
        if (viewMode === 'month') return isSameMonth(pDate, selectedDate);
        return true;
    });

    const totalRevenue = filteredPayments
        .filter((p: Payment) => p.status === 'COMPLETED')
        .reduce((sum: number, p: Payment) => sum + parseFloat(p.amount || '0'), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors">
                <div>
                    
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-1 font-black uppercase tracking-widest italic leading-none">Control financiero y registro de abonos</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-gray-50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-white/10">
                        <button
                            onClick={() => setViewMode('all')}
                            className={cn(
                                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                viewMode === 'all' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-gray-400"
                            )}
                        >
                            Todo
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            className={cn(
                                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                viewMode === 'day' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-gray-400"
                            )}
                        >
                            Día
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                viewMode === 'month' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-gray-400"
                            )}
                        >
                            Mes
                        </button>
                    </div>

                    {viewMode !== 'all' && (
                        <input
                            type={viewMode === 'day' ? 'date' : 'month'}
                            value={format(selectedDate, viewMode === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value + (viewMode === 'month' ? '-02' : '')))}
                            className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-gym-primary transition-all"
                        />
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/cash-flow')}
                            className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 font-black px-6 py-4 rounded-[1.25rem] flex items-center gap-3 transition-all border border-red-100 dark:border-red-500/20 uppercase tracking-widest text-[10px] active:scale-95"
                        >
                            <TrendingDown size={18} strokeWidth={3} />
                            <span>Agregar Egreso</span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-900 dark:bg-gym-primary hover:bg-slate-800 dark:hover:bg-gym-primary/90 text-white dark:text-slate-900 font-black px-8 py-4 rounded-[1.25rem] flex items-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-none uppercase tracking-widest text-xs active:scale-95"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span>Registrar Pago</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Total Balance Summary */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gym-primary/10 rounded-2xl flex items-center justify-center text-gym-primary border border-gym-primary/20 group-hover:scale-110 transition-transform duration-500">
                        <CircleDollarSign size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] italic">Total Recaudado ({viewMode === 'all' ? 'Histórico' : viewMode === 'day' ? 'del Día' : 'del Mes'})</p>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic mt-1">
                            <span className="text-gym-primary text-sm not-italic mr-2">S/</span>
                            {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm shadow-gray-100 dark:shadow-none transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5 text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-[0.2em] bg-gray-50/50 dark:bg-white/5 transition-colors">
                                <th className="px-8 py-6">Fecha y Hora</th>
                                <th className="px-8 py-6">Afiliado / Cliente</th>
                                <th className="px-8 py-6 text-center">Tipo de Movimiento</th>
                                <th className="px-8 py-6 text-center">Método</th>
                                <th className="px-8 py-6 text-right">Monto Operación</th>
                                <th className="px-8 py-6 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 dark:text-gray-500 group-hover:bg-gym-primary/10 group-hover:text-gym-primary transition-all">
                                                <Calendar size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{format(new Date(payment.date), 'dd/MM/yyyy')}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{format(new Date(payment.date), 'HH:mm')} hrs</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {payment.member ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 dark:bg-gym-primary rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-black text-xs transition-colors">
                                                    {payment.member.firstName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {payment.member.firstName} {payment.member.lastName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black tracking-widest uppercase mt-0.5">{payment.member.dni}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-gray-300 dark:text-gray-700 tracking-[0.2em]">S/ Identificar</span>
                                                {payment.type === 'PRODUCT' && payment.notes && (
                                                    <span className="text-[9px] text-gym-primary font-bold italic mt-0.5 truncate max-w-[150px]">{payment.notes.split(' - ')[0]}</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-slate-500 dark:text-gray-400 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                            {payment.type === 'MEMBERSHIP' ? 'MEMBRESÍA' : 
                                             payment.type === 'SPECIAL_CLASS' ? 'CLASE ESPECIAL' : 
                                             payment.type === 'PRODUCT' ? (payment.notes?.startsWith('Venta:') ? payment.notes : 'PRODUCTO') : 
                                             payment.type === 'OTHER' ? 'OTRO' : payment.type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 bg-slate-900 dark:bg-gym-primary text-white dark:text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors">
                                            {payment.method === 'CASH' ? 'EFECTIVO' :
                                             payment.method === 'CARD' ? 'TARJETA' :
                                             payment.method === 'TRANSFER' ? 'TRANSFERENCIA' : payment.method}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className={cn(
                                            "flex flex-col items-end",
                                            payment.status === 'VOIDED' && "opacity-30"
                                        )}>
                                            <span className={cn(
                                                "text-xl font-black italic tracking-tighter text-slate-900 dark:text-white transition-colors",
                                                payment.status === 'VOIDED' && "line-through decoration-red-500 decoration-2"
                                            )}>
                                                <span className="text-gym-primary text-xs not-italic mr-1">S/</span>
                                                {parseFloat(payment.amount).toFixed(2)}
                                            </span>
                                            {payment.status === 'VOIDED' && (
                                                <span className="text-[8px] font-black uppercase text-red-500 tracking-[0.2em] mt-1 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded border border-red-100 dark:border-red-500/20">Movimiento Anulado</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-xs">
                                            {payment.status !== 'VOIDED' && (
                                                <button
                                                    onClick={() => handleVoid(payment.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-orange-50 dark:bg-orange-500/10 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500 rounded-xl transition-all border border-orange-100 dark:border-orange-500/20 shadow-sm hover:text-white"
                                                    title="Anular Pago"
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(payment.id)}
                                                className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 rounded-xl transition-all border border-red-100 dark:border-red-500/20 shadow-sm hover:text-white"
                                                title="Eliminar Permanente"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center text-gray-300 dark:text-gray-800 transition-colors">
                                        <div className="flex flex-col items-center gap-4">
                                            <Ban size={48} className="text-gray-100 dark:text-gray-800" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em] italic">No hay registros financieros</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default Payments;
