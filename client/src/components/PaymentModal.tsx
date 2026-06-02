import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Search } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

interface Member {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        memberId: '',
        amount: '',
        method: 'CASH',
        type: 'MEMBERSHIP',
        notes: ''
    });
    const [members, setMembers] = useState<Member[]>([]);
    const [searchMember, setSearchMember] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch members for selection
    useEffect(() => {
        if (isOpen) {
            const fetchMembers = async () => {
                try {
                    const response = await api.get(`/members?search=${searchMember}`);
                    setMembers(response.data);
                } catch (err) {
                    console.error('Error fetching members', err);
                }
            };
            const debounce = setTimeout(fetchMembers, 300);
            return () => clearTimeout(debounce);
        }
    }, [isOpen, searchMember]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.memberId) {
            setError('Debe seleccionar un miembro');
            setLoading(false);
            return;
        }

        try {
            await api.post('/payments', {
                ...formData,
                memberId: parseInt(formData.memberId),
                amount: parseFloat(formData.amount)
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al registrar pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] w-full max-w-lg max-h-[95vh] shadow-[0_20px_70px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                <div className="flex justify-between items-center px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 transition-colors shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Registrar Operación</h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Ingreso de flujo de caja</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-6 sm:y-8">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-500 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="text-xs font-black uppercase tracking-tight">{error}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">IDENTIFICAR MIEMBRO *</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={searchMember}
                                    onChange={(e) => setSearchMember(e.target.value)}
                                    placeholder="Nombre, apellido o DNI..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-8 focus:ring-gym-primary/5 transition-all font-bold text-sm"
                                />
                            </div>
                            {members.length > 0 && !formData.memberId && (
                                <div className="mt-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2">
                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {members.map(member => (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, memberId: member.id.toString() })}
                                                className="w-full text-left px-5 py-3 hover:bg-gym-primary/10 hover:text-gym-primary transition-all border-b border-gray-100 dark:border-white/5 last:border-0 flex flex-col"
                                            >
                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">{member.firstName} {member.lastName}</span>
                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{member.dni}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.memberId && (
                                <div className="mt-2 flex items-center justify-between bg-gym-primary/10 border-2 border-gym-primary/20 p-4 rounded-2xl animate-in zoom-in-95">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gym-primary uppercase tracking-[0.2em] leading-none mb-1">Miembro Seleccionado</span>
                                        <span className="font-black text-slate-900 dark:text-white text-sm">
                                            {members.find(m => m.id.toString() === formData.memberId)?.firstName} {members.find(m => m.id.toString() === formData.memberId)?.lastName}
                                        </span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, memberId: '' })}
                                        className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">MONTO (S/) *</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-xl font-black focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all italic tracking-tight"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">MÉTODO *</label>
                                <select
                                    name="method"
                                    value={formData.method}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all h-[60px]"
                                >
                                    <option value="CASH" className="dark:bg-slate-900">Efectivo 💵</option>
                                    <option value="CARD" className="dark:bg-slate-900">Tarjeta 💳</option>
                                    <option value="TRANSFER" className="dark:bg-slate-900">Transf. 🏦</option>
                                    <option value="YAPE" className="dark:bg-slate-900">Yape 📱</option>
                                    <option value="PLIN" className="dark:bg-slate-900">Plin 📱</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">TIPO DE INGRESO</label>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                {(['MEMBERSHIP', 'PRODUCT', 'OTHER'] as const).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: t })}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border-2 uppercase",
                                            formData.type === t
                                                ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-lg"
                                                : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-white/20"
                                        )}
                                    >
                                        {t === 'MEMBERSHIP' ? 'Membresía' : t === 'PRODUCT' ? 'Producto' : 'Otro'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">NOTAS ADICIONALES</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all min-h-[100px] placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 p-6 sm:px-10 sm:py-8 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 transition-colors shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-black px-10 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-gym-primary/20 uppercase tracking-widest text-xs min-w-[200px]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} strokeWidth={3} />
                                    <span>Guardar Pago</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
