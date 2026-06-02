import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface PlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plan?: any;
}

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, onSuccess, plan }) => {
    const [formData, setFormData] = useState({
        name: '',
        durationDays: 30,
        price: '',
        description: '',
        active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                durationDays: plan.durationDays || 30,
                price: plan.price || '',
                description: plan.description || '',
                active: plan.active ?? true
            });
        } else {
            setFormData({
                name: '',
                durationDays: 30,
                price: '',
                description: '',
                active: true
            });
        }
        setError(null);
    }, [plan, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement; // Type assertion for checkbox handling if needed
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price.toString())
            };

            if (plan) {
                await api.put(`/plans/${plan.id}`, payload);
            } else {
                await api.post('/plans', payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al guardar el plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {plan ? 'Editar Plan' : 'Nuevo Plan'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-500 px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nombre del Plan *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold"
                                placeholder="Ej: Mensual Básico"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Duración (días) *</label>
                                <input
                                    type="number"
                                    name="durationDays"
                                    value={formData.durationDays}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-xl px-4 py-3 text-slate-900 dark:text-white font-black text-xl focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all tracking-tight"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Precio *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-xl px-4 py-3 text-slate-900 dark:text-white font-black text-xl focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all italic tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Descripción</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all min-h-[100px] font-medium"
                                placeholder="Detalles del plan..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Guardar Plan</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PlanModal;
