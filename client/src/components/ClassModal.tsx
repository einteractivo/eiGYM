import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import GymClassService, { type GymClass } from '../services/GymClassService';

interface ClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    gymClass?: GymClass;
}

const ClassModal: React.FC<ClassModalProps> = ({ isOpen, onClose, onSuccess, gymClass }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#7C3AED', // Default violet
        active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (gymClass) {
            setFormData({
                name: gymClass.name,
                description: gymClass.description || '',
                color: gymClass.color || '#7C3AED',
                active: gymClass.active
            });
        } else {
            setFormData({
                name: '',
                description: '',
                color: '#7C3AED',
                active: true
            });
        }
    }, [gymClass, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (gymClass) {
                await GymClassService.updateClass(gymClass.id, formData);
            } else {
                await GymClassService.createClass(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving class:', error);
            alert('Error al guardar la clase');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] w-full max-w-lg shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                <div className="px-10 py-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{gymClass ? 'Editar Clase' : 'Nueva Clase'}</h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Definición de actividades</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">NOMBRE DE LA CLASE *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                            placeholder="Ej. Spinning, Yoga, Crossfit"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">COLOR DE IDENTIFICACIÓN</label>
                        <div className="flex flex-wrap gap-3">
                            {['#F87171', '#FB923C', '#FBBF24', '#34D399', '#60A5FA', '#818CF8', '#A78BFA', '#F472B6', '#94A3B8'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: c })}
                                    className={`w-10 h-10 rounded-2xl transition-all ${formData.color === c ? 'ring-4 ring-offset-4 ring-offset-white dark:ring-offset-slate-900 ring-gym-primary scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input 
                                type="color" 
                                value={formData.color} 
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                title="Color personalizado"
                                className="w-10 h-10 rounded-2xl cursor-pointer bg-transparent border-2 border-gray-100 dark:border-white/10 p-1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <input
                            type="checkbox"
                            id="class-active"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-5 h-5 rounded-lg border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gym-primary focus:ring-gym-primary transition-all cursor-pointer"
                        />
                        <label htmlFor="class-active" className="text-xs font-bold text-slate-600 dark:text-gray-400 select-none cursor-pointer uppercase tracking-tight">
                            Clase activa y disponible para horarios
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 transition-colors">
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
                                    <span>Guardar Clase</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClassModal;
