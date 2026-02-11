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
        active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (gymClass) {
            setFormData({
                name: gymClass.name,
                description: gymClass.description || '',
                active: gymClass.active
            });
        } else {
            setFormData({
                name: '',
                description: '',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gym-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{gymClass ? 'Editar Clase' : 'Nueva Clase'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Clase</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gym-primary transition-colors text-white"
                            placeholder="Ej. Spinning, Yoga, Crossfit"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gym-primary transition-colors text-white h-32 resize-none"
                            placeholder="Describe lo que se hace en esta clase..."
                        />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            id="class-active"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-gym-primary focus:ring-gym-primary"
                        />
                        <label htmlFor="class-active" className="text-sm font-medium text-gray-300 select-none cursor-pointer">
                            Clase activa y disponible para horarios
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-gym-primary hover:bg-gym-primary/90 text-white font-semibold transition-all shadow-lg shadow-gym-primary/20 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Clase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClassModal;
