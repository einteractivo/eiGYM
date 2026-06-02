import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SpecialClassService, { type SpecialClass } from '../services/SpecialClassService';

interface SpecialClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    specialClass?: SpecialClass;
}

const SpecialClassModal: React.FC<SpecialClassModalProps> = ({ isOpen, onClose, onSuccess, specialClass }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [dayOfWeek, setDayOfWeek] = useState<number | ''>('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');
    const [capacity, setCapacity] = useState<number | ''>('');
    const [color, setColor] = useState('#4F46E5'); // Default indigo
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);

    const DAYS = [
        { id: 1, name: 'Lunes' },
        { id: 2, name: 'Martes' },
        { id: 3, name: 'Miércoles' },
        { id: 4, name: 'Jueves' },
        { id: 5, name: 'Viernes' },
        { id: 6, name: 'Sábado' },
        { id: 0, name: 'Domingo' },
    ];

    useEffect(() => {
        if (specialClass) {
            setName(specialClass.name);
            setDescription(specialClass.description || '');
            setPrice(specialClass.price || '');
            setDayOfWeek(specialClass.dayOfWeek ?? '');
            setStartTime(specialClass.startTime || '08:00');
            setEndTime(specialClass.endTime || '09:00');
            setCapacity(specialClass.capacity || '');
            setColor(specialClass.color || '#4F46E5');
            setActive(specialClass.active !== false);
        } else {
            setName('');
            setDescription('');
            setPrice('');
            setDayOfWeek('');
            setStartTime('08:00');
            setEndTime('09:00');
            setCapacity('');
            setColor('#4F46E5');
            setActive(true);
        }
    }, [specialClass, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name,
            description,
            price: Number(price),
            dayOfWeek: dayOfWeek === '' ? undefined : Number(dayOfWeek),
            startTime,
            endTime,
            capacity: capacity ? Number(capacity) : undefined,
            color,
            active
        };

        try {
            if (specialClass) {
                await SpecialClassService.update(specialClass.id, payload);
            } else {
                await SpecialClassService.create(payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving special class:', error);
            alert('Error al guardar la clase especial');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold dark:text-white uppercase">
                        {specialClass ? 'Editar Clase Especial' : 'Nueva Clase Especial'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 dark:text-white focus:ring-2 focus:ring-gym-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 dark:text-white focus:ring-2 focus:ring-gym-primary resize-none h-16"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Precio</label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 dark:text-white focus:ring-2 focus:ring-gym-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Capacidad (Opcional)</label>
                            <input
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 dark:text-white focus:ring-2 focus:ring-gym-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">DÍA DE LA SEMANA</label>
                        <div className="flex flex-wrap gap-1.5">
                            {DAYS.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => setDayOfWeek(day.id)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dayOfWeek === day.id
                                        ? 'bg-gym-primary text-slate-900 shadow-md shadow-gym-primary/20'
                                        : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-white/10'
                                        }`}
                                >
                                    {day.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">HORA INICIO</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">HORA FIN</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">COLOR DE IDENTIFICACIÓN</label>
                        <div className="flex flex-wrap gap-2.5">
                            {['#4F46E5', '#7C3AED', '#EC4899', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-9 h-9 rounded-2xl transition-all ${color === c ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input 
                                type="color" 
                                value={color} 
                                onChange={(e) => setColor(e.target.value)}
                                className="w-9 h-9 rounded-2xl cursor-pointer bg-transparent border-2 border-gray-100 dark:border-white/10 p-1"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gym-primary text-slate-900 font-bold rounded-xl hover:bg-gym-primary/90 transition disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SpecialClassModal;
