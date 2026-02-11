import React, { useEffect, useState } from 'react';
import { Plus, Calendar, Trash2, Ban } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
    const { user } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPayments = async () => {
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ingresos</h1>
                    <p className="text-gray-400 mt-1">Historial de pagos y registro de ingresos por membresías y productos</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                >
                    <Plus size={20} />
                    <span>Registrar Pago</span>
                </button>
            </div>

            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                                <th className="p-6 font-semibold">Fecha</th>
                                <th className="p-6 font-semibold">Miembro</th>
                                <th className="p-6 font-semibold">Tipo</th>
                                <th className="p-6 font-semibold">Método</th>
                                <th className="p-6 font-semibold text-right">Monto</th>
                                {['ADMIN', 'SUPERADMIN', 'RECEPTION'].includes(user?.role || '') && <th className="p-6 font-semibold text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-6 text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-500" />
                                            {new Date(payment.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        {payment.member ? (
                                            <div>
                                                <div className="font-semibold text-white">
                                                    {payment.member.firstName} {payment.member.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500">DNI: {payment.member.dni}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">Sin miembro</span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <span className="bg-white/5 text-gray-300 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                            {payment.type}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            {payment.method}
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className={cn(
                                            "flex flex-col items-end",
                                            payment.status === 'VOIDED' && "opacity-40"
                                        )}>
                                            <span className={cn(
                                                "text-gym-primary font-bold text-lg",
                                                payment.status === 'VOIDED' && "line-through"
                                            )}>
                                                S/ {payment.amount}
                                            </span>
                                            {payment.status === 'VOIDED' && (
                                                <span className="text-[10px] font-black uppercase text-red-500 tracking-tighter">ANULADO</span>
                                            )}
                                        </div>
                                    </td>
                                    {['ADMIN', 'SUPERADMIN', 'RECEPTION'].includes(user?.role || '') && (
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {payment.status !== 'VOIDED' && (
                                                    <button
                                                        onClick={() => handleVoid(payment.id)}
                                                        className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors"
                                                        title="Anular Pago"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(payment.id)}
                                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    title="Eliminar Permanente"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {payments.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={['ADMIN', 'SUPERADMIN', 'RECEPTION'].includes(user?.role || '') ? 6 : 5} className="p-12 text-center text-gray-500 italic">
                                        No hay pagos registrados
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
