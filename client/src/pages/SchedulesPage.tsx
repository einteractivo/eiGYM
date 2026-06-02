import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Printer } from 'lucide-react';
import GymClassService, { type GymClass, type Schedule } from '../services/GymClassService';
import SpecialClassService, { type SpecialClass } from '../services/SpecialClassService';
import ScheduleModal from '../components/ScheduleModal';
import api from '../services/api';

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
    useEffect(() => {
        // Add print-specific style to document
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                body {
                    background: white !important;
                }
                .no-print {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [specialClasses, setSpecialClasses] = useState<SpecialClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | undefined>(undefined);
    const [gymSettings, setGymSettings] = useState<any>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedulesData, classesData, specialClassesData, settingsData] = await Promise.all([
                GymClassService.getAllSchedules(),
                GymClassService.getAllClasses(),
                SpecialClassService.getAll(),
                api.get('/settings').catch(() => ({ data: {} }))
            ]);
            setSchedules(schedulesData || []);
            setClasses(classesData || []);
            setSpecialClasses(specialClassesData || []);
            setGymSettings(settingsData.data);
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

    const handlePrint = () => {
        window.print();
    };

    const getContrastYIQ = (hexcolor: string | undefined) => {
        if (!hexcolor) return 'text-slate-900';
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'text-slate-900' : 'text-white';
    };

    // Extract unique time slots across the entire week (Normal + Special)
    const allTimeSlots = [
        ...schedules.map(s => `${s.startTime} A ${s.endTime}`),
        ...specialClasses.filter(sc => sc.startTime && sc.endTime && sc.active).map(sc => `${sc.startTime} A ${sc.endTime}`)
    ];
    
    const timeSlots = Array.from(new Set(allTimeSlots))
        .sort((a, b) => a.localeCompare(b));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    
                    <p className="text-gray-400 dark:text-gray-500 mt-1">Vista semanal completa de actividades</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="bg-slate-900 border border-transparent hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl dark:bg-white/10 dark:hover:bg-white/20"
                    >
                        <Printer size={20} />
                        <span className="hidden sm:inline">Exportar PDF</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gym-primary hover:bg-gym-primary/90 text-white dark:text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20 dark:shadow-none"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Añadir Horario</span>
                    </button>
                </div>
            </div>

            <div id="printable-schedule" className="overflow-x-auto print:overflow-visible print:w-full rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm transition-colors print:border-none print:shadow-none">
                <div className="hidden print:block mb-8 text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">{gymSettings?.gym_name || 'CENTROM EIGYM'}</h2>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-2">Horario Semanal de Clases</p>
                </div>
                <table className="w-full border-separate border-spacing-2">
                    <thead>
                        <tr>
                            <th className="bg-gym-primary dark:bg-gym-primary text-white dark:text-slate-900 font-black py-4 px-6 rounded-2xl text-sm tracking-wider uppercase min-w-[150px] shadow-lg shadow-gym-primary/20 dark:shadow-none">
                                HORA
                            </th>
                            {DAYS.map(day => (
                                <th key={day.id} className="bg-gym-primary dark:bg-gym-primary text-white dark:text-slate-900 font-black py-4 px-3 rounded-2xl text-sm tracking-wider uppercase min-w-[140px] shadow-lg shadow-gym-primary/20 dark:shadow-none">
                                    {day.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(slot => (
                            <tr key={slot}>
                                <td className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gym-primary dark:text-gym-primary font-black py-4 px-6 rounded-2xl text-center text-xs whitespace-nowrap shadow-sm print:border-black/20">
                                    {slot} HS
                                </td>
                                {DAYS.map(day => {
                                    const schedule = schedules.find(s =>
                                        s.dayOfWeek === day.id &&
                                        `${s.startTime} A ${s.endTime}` === slot
                                    );

                                    if (schedule) {
                                        // For PDF/Print, if no color is picked, alternate vibrant pastel colors
                                        const fallbackColors = ['#DBEAFE', '#E0E7FF', '#F3E8FF', '#FAE8FF', '#FCE7F3', '#FFE4E6', '#FFEDD5', '#FEF3C7', '#D1FAE5', '#CFFAFE'];
                                        const printBgColor = schedule.gymClass?.color && schedule.gymClass.color !== '#FFFFFF' 
                                            ? schedule.gymClass.color 
                                            : fallbackColors[schedule.id % fallbackColors.length];
                                        
                                        const bgColor = printBgColor;
                                        const textColor = getContrastYIQ(bgColor);
                                        const isWhite = bgColor.toUpperCase() === '#FFFFFF' || bgColor.toUpperCase() === '#FFF';

                                        return (
                                            <td key={day.id} className="relative group p-0 print:p-1">
                                                <div 
                                                    className={`font-bold py-4 px-3 rounded-2xl text-center shadow-xl dark:shadow-none h-full flex flex-col items-center justify-center min-h-[80px] group-hover:scale-[1.02] transition-all duration-300 border border-gray-100 dark:border-white/5 print-solid-border ${textColor}`}
                                                    style={{ backgroundColor: bgColor }}
                                                >
                                                    <span className="text-sm uppercase leading-tight print:font-black">{schedule.gymClass?.name}</span>
                                                    <span className={`text-[10px] font-medium mt-1 uppercase tracking-tighter ${isWhite ? 'text-gray-400 dark:text-gray-500' : 'opacity-80'} print:font-bold`}>Profe: {schedule.trainer?.name}</span>

                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                                        <button
                                                            onClick={() => handleOpenModal(schedule)}
                                                            className="p-1.5 bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-gym-primary hover:text-white dark:hover:text-slate-900 rounded-lg text-slate-400 dark:text-gray-500 transition-colors"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(schedule.id)}
                                                            className="p-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 rounded-lg text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    }

                                    // Check if there's a Special Class for this slot
                                    const specialClass = specialClasses.find(sc => 
                                        sc.active &&
                                        sc.dayOfWeek === day.id &&
                                        `${sc.startTime} A ${sc.endTime}` === slot
                                    );

                                    if (specialClass) {
                                        // Specific solid color for special classes if not set or if set to white
                                        const printBgColor = specialClass.color && specialClass.color !== '#4F46E5' && specialClass.color.toUpperCase() !== '#FFFFFF'
                                            ? specialClass.color
                                            : '#FEF3C7'; // Amber/Yellow for special classes in print
                                        
                                        const bgColor = printBgColor;
                                        const textColor = getContrastYIQ(bgColor);

                                        return (
                                            <td key={`${day.id}-special`} className="relative group p-0 print:p-1">
                                                <div 
                                                    className={`font-black py-4 px-3 rounded-2xl text-center shadow-xl h-full flex flex-col items-center justify-center min-h-[80px] group-hover:scale-[1.02] transition-all duration-300 border-2 border-white/20 ${textColor}`}
                                                    style={{ backgroundColor: bgColor }}
                                                >
                                                    <span className="text-sm uppercase leading-tight">{specialClass.name}</span>
                                                    <span className={`text-[10px] font-bold mt-1 uppercase tracking-widest italic ${textColor.includes('white') ? 'opacity-80' : 'opacity-70'} print:text-red-600`}>CLASE ESPECIAL</span>
                                                    <span className={`text-[10px] font-black mt-0.5 uppercase tracking-tighter ${textColor.includes('white') ? 'opacity-90' : 'opacity-80'}`}>S/ {specialClass.price}</span>
                                                </div>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={day.id} className="p-0">
                                            <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-100/50 dark:border-white/5 text-gray-700 dark:text-gray-800 font-black py-4 px-3 rounded-2xl text-center h-full flex items-center justify-center min-h-[80px] transition-colors hover:bg-gray-100 dark:hover:bg-white/10 print-dashed-border">
                                                <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-10 print:text-black print:opacity-30">DISPONIBLE</span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {loading && schedules.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-20 text-center print:hidden">
                                    <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-500">Cargando horario...</p>
                                </td>
                            </tr>
                        )}

                        {!loading && timeSlots.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl print:hidden">
                                    <div className="flex flex-col items-center gap-4">
                                        <Calendar size={48} className="text-gray-200 dark:text-gray-800" />
                                        <div>
                                            <p className="text-gray-400 dark:text-gray-600 font-medium uppercase text-xs tracking-widest font-black">No hay horarios registrados</p>
                                            <p className="text-[10px] text-gray-300 dark:text-gray-700 uppercase font-bold mt-1">Empieza por añadir una nueva sesión</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-schedule, #printable-schedule * {
                        visibility: visible;
                    }
                    #printable-schedule {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        transform-origin: top left;
                        overflow: visible !important;
                    }
                    #printable-schedule::-webkit-scrollbar {
                        display: none !important;
                    }
                    .print-solid-border {
                        border: 2px solid #000 !important;
                        border-radius: 12px !important;
                        /* Allow background colors to show up in print */
                        box-shadow: none !important;
                    }
                    .print-dashed-border {
                        border: 1px dashed #999 !important;
                        border-radius: 12px !important;
                        background-color: transparent !important;
                        box-shadow: none !important;
                    }
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                }
            `}</style>

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
