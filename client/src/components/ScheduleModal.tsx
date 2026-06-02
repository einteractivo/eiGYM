import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import GymClassService, { type GymClass, type Schedule, type Trainer } from '../services/GymClassService';
import UserModal from './UserModal';

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

    const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);

    const fetchTrainers = async () => {
        try {
            const data = await GymClassService.getTrainers();
            setTrainers(data);
        } catch (error) {
            console.error('Error fetching trainers:', error);
        }
    };

    useEffect(() => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] w-full max-w-lg shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                <div className="px-10 py-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{schedule ? 'Editar Horario' : 'Nuevo Horario'}</h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Gestión de tiempos y clases</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">CLASE *</label>
                            <select
                                required
                                value={formData.classId}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-xs uppercase tracking-tight appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="dark:bg-slate-900">Seleccionar clase</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id} className="dark:bg-slate-900">
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">ENTRENADOR *</label>
                                <button
                                    type="button"
                                    onClick={() => setIsTrainerModalOpen(true)}
                                    className="text-[10px] font-black text-gym-primary hover:text-gym-primary/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={12} strokeWidth={3} /> Nuevo
                                </button>
                            </div>
                            <select
                                required
                                value={formData.trainerId}
                                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-xs uppercase tracking-tight appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="dark:bg-slate-900">Seleccionar entrenador</option>
                                {trainers.map(trainer => (
                                    <option key={trainer.id} value={trainer.id} className="dark:bg-slate-900">
                                        {trainer.name} ({trainer.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">DÍA DE LA SEMANA</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, dayOfWeek: day.id })}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.dayOfWeek === day.id
                                        ? 'bg-gym-primary text-white shadow-lg shadow-gym-primary/20'
                                        : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-white/10'
                                        }`}
                                >
                                    {day.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">HORA INICIO</label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">HORA FIN</label>
                            <input
                                type="time"
                                required
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">CAPACIDAD MÁXIMA</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <input
                            type="checkbox"
                            id="schedule-active"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-5 h-5 rounded-lg border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gym-primary focus:ring-gym-primary transition-all cursor-pointer"
                        />
                        <label htmlFor="schedule-active" className="text-xs font-bold text-slate-600 dark:text-gray-400 select-none cursor-pointer uppercase tracking-tight">
                            Horario activo y visible en el sistema
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
                                    <span>Guardar Horario</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
                
            </div>

            <UserModal
                isOpen={isTrainerModalOpen}
                onClose={() => setIsTrainerModalOpen(false)}
                onSuccess={fetchTrainers}
                initialRole="TRAINER"
            />
        </div>
    );
};

export default ScheduleModal;
