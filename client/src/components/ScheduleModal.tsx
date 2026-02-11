import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import GymClassService, { type GymClass, type Schedule, type Trainer } from '../services/GymClassService';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    schedule?: Schedule;
    classes: GymClass[];
}

const DAYS = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' },
];

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSuccess, schedule, classes }) => {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [formData, setFormData] = useState({
        classId: '',
        trainerId: '',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '09:00',
        capacity: 20,
        active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const data = await GymClassService.getTrainers();
                setTrainers(data);
            } catch (error) {
                console.error('Error fetching trainers:', error);
            }
        };
        if (isOpen) fetchTrainers();
    }, [isOpen]);

    useEffect(() => {
        if (schedule) {
            setFormData({
                classId: schedule.classId.toString(),
                trainerId: schedule.trainerId.toString(),
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                capacity: schedule.capacity,
                active: schedule.active
            });
        } else {
            setFormData({
                classId: classes.length > 0 ? classes[0].id.toString() : '',
                trainerId: '',
                dayOfWeek: 1,
                startTime: '08:00',
                endTime: '09:00',
                capacity: 20,
                active: true
            });
        }
    }, [schedule, isOpen, classes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.classId || !formData.trainerId) {
            alert('Por favor selecciona una clase y un entrenador');
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                classId: parseInt(formData.classId),
                trainerId: parseInt(formData.trainerId),
                capacity: parseInt(formData.capacity.toString())
            };

            if (schedule) {
                await GymClassService.updateSchedule(schedule.id, dataToSave);
            } else {
                await GymClassService.createSchedule(dataToSave);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Error al guardar el horario');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gym-card w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{schedule ? 'Editar Horario' : 'Nuevo Horario'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Clase</label>
                            <select
                                required
                                value={formData.classId}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gym-primary transition-colors text-white"
                            >
                                <option value="" disabled className="bg-gym-card text-gray-400">Seleccionar clase</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id} className="bg-gym-card text-white">
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Entrenador</label>
                            <select
                                required
                                value={formData.trainerId}
                                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gym-primary transition-colors text-white"
                            >
                                <option value="" disabled className="bg-gym-card text-gray-400">Seleccionar entrenador</option>
                                {trainers.map(trainer => (
                                    <option key={trainer.id} value={trainer.id} className="bg-gym-card text-white">
                                        {trainer.name} ({trainer.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Día de la Semana</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, dayOfWeek: day.id })}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${formData.dayOfWeek === day.id
                                        ? 'bg-gym-primary text-white shadow-lg shadow-gym-primary/20'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {day.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Hora Inicio</label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gym-primary transition-colors text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Hora Fin</label>
                            <input
                                type="time"
                                required
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gym-primary transition-colors text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Capacidad Máxima</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gym-primary transition-colors text-white"
                        />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            id="schedule-active"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-gym-primary focus:ring-gym-primary"
                        />
                        <label htmlFor="schedule-active" className="text-sm font-medium text-gray-300 select-none cursor-pointer">
                            Horario activo y visible
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
                            {loading ? 'Guardando...' : 'Guardar Horario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleModal;
