import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import GymClassService, { type GymClass, type Schedule } from '../services/GymClassService';
import ScheduleModal from '../components/ScheduleModal';

const DAYS = [
    { id: 1, name: 'LUNES' },
    { id: 2, name: 'MARTES' },
    { id: 3, name: 'MIÉRCOLES' },
    { id: 4, name: 'JUEVES' },
    { id: 5, name: 'VIERNES' },
    { id: 6, name: 'SÁBADO' },
    { id: 0, name: 'DOMINGO' },
];

const SchedulesPage: React.FC = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>(undefined);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedulesData, classesData] = await Promise.all([
                GymClassService.getAllSchedules(),
                GymClassService.getAllClasses()
            ]);
            setSchedules(schedulesData || []);
            setClasses(classesData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (schedule?: Schedule) => {
        setSelectedSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSchedule(undefined);
    };

    const handleSuccess = () => {
        fetchData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este horario?')) return;
        try {
            await GymClassService.deleteSchedule(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Error al eliminar el horario');
        }
    };

    // Extract unique time slots across the entire week
    const timeSlots = Array.from(new Set(schedules.map(s => `${s.startTime} A ${s.endTime}`)))
        .sort((a, b) => a.localeCompare(b));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">Horario de Clases</h1>
                    <p className="text-gray-400 mt-1">Vista semanal completa de actividades</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                    >
                        <Plus size={20} />
                        <span>Añadir Horario</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/10 backdrop-blur-sm">
                <table className="w-full border-separate border-spacing-2">
                    <thead>
                        <tr>
                            <th className="bg-gym-primary text-white font-black py-4 px-6 rounded-2xl text-sm tracking-wider uppercase min-w-[150px] shadow-lg shadow-gym-primary/20">
                                HORA
                            </th>
                            {DAYS.map(day => (
                                <th key={day.id} className="bg-gym-primary text-white font-black py-4 px-3 rounded-2xl text-sm tracking-wider uppercase min-w-[140px] shadow-lg shadow-gym-primary/20">
                                    {day.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(slot => (
                            <tr key={slot}>
                                <td className="bg-gym-primary/10 border border-gym-primary/20 text-gym-primary font-black py-4 px-6 rounded-2xl text-center text-xs whitespace-nowrap shadow-sm">
                                    {slot} HS
                                </td>
                                {DAYS.map(day => {
                                    const schedule = schedules.find(s =>
                                        s.dayOfWeek === day.id &&
                                        `${s.startTime} A ${s.endTime}` === slot
                                    );

                                    if (schedule) {
                                        return (
                                            <td key={day.id} className="relative group p-0">
                                                <div className="bg-white text-gym-dark font-bold py-4 px-3 rounded-2xl text-center shadow-xl h-full flex flex-col items-center justify-center min-h-[80px] group-hover:scale-[1.02] transition-all duration-300">
                                                    <span className="text-sm uppercase leading-tight">{schedule.gymClass?.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium mt-1">PROFE: {schedule.trainer?.name}</span>

                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenModal(schedule)}
                                                            className="p-1.5 bg-gym-dark/5 hover:bg-gym-dark/10 rounded-lg text-gym-dark transition-colors"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(schedule.id)}
                                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={day.id} className="p-0">
                                            <div className="bg-white/5 border border-white/5 text-gray-700 font-black py-4 px-3 rounded-2xl text-center h-full flex items-center justify-center min-h-[80px] transition-colors hover:bg-white/10">
                                                <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-20">DISPONIBLE</span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {loading && schedules.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-500">Cargando horario...</p>
                                </td>
                            </tr>
                        )}

                        {!loading && timeSlots.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <div className="flex flex-col items-center gap-4">
                                        <Calendar size={48} className="text-gray-700" />
                                        <div>
                                            <p className="text-gray-500 font-medium">No hay horarios registrados</p>
                                            <p className="text-sm text-gray-600">Empieza por añadir una nueva sesión</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                schedule={selectedSchedule}
                classes={classes}
            />
        </div>
    );
};

export default SchedulesPage;
