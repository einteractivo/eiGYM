import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Filter,
    Users,
    Clock,
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    Trophy
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendanceHistoryProps { }

interface Attendance {
    id: number;
    date: string;
    accessAllowed: boolean;
    method: string;
    member: {
        firstName: string;
        lastName: string;
        dni: string;
    };
    schedule?: {
        gymClass: {
            name: string;
        };
        trainer: {
            name: string;
        };
        startTime: string;
        endTime: string;
    };
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = () => {
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [classes, setClasses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'members' | 'trainers'>('members');
    const [trainerAttendances, setTrainerAttendances] = useState<any[]>([]);

    useEffect(() => {
        fetchAttendances();
        fetchClasses();
        fetchTrainerAttendances();
    }, []);

    const fetchTrainerAttendances = async () => {
        try {
            const response = await api.get('/trainer-attendance/history');
            setTrainerAttendances(response.data);
        } catch (error) {
            console.error('Error fetching trainer attendances:', error);
        }
    };

    const fetchAttendances = async () => {
        setLoading(true);
        try {
            const response = await api.get('/attendance');
            setAttendances(response.data);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredAttendances = attendances.filter(att => {
        const attDate = new Date(att.date);
        const matchesDate = isSameDay(attDate, selectedDate);
        const matchesSearch = att.member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            att.member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            att.member.dni.includes(searchQuery);
        const matchesClass = selectedClass === 'all' ||
            (selectedClass === 'no-class' && !att.schedule) ||
            att.schedule?.gymClass.name === selectedClass;

        return matchesDate && matchesSearch && matchesClass;
    });

    const filteredTrainerAttendances = trainerAttendances.filter(att => {
        const attDate = new Date(att.checkIn);
        const matchesDate = isSameDay(attDate, selectedDate);
        const matchesSearch = att.trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            att.trainer.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesDate && matchesSearch;
    });

    const stats = {
        total: activeTab === 'members' ? filteredAttendances.length : filteredTrainerAttendances.length,
        allowed: activeTab === 'members' ? filteredAttendances.filter(a => a.accessAllowed).length : filteredTrainerAttendances.filter(a => a.status === 'PRESENT').length,
        denied: activeTab === 'members' ? filteredAttendances.filter(a => !a.accessAllowed).length : filteredTrainerAttendances.filter(a => a.status === 'LATE').length
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <div>
                    
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Consulta detallada por día y clase</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
                        className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3 bg-gym-primary/10 border border-gym-primary/20 px-6 py-3 rounded-2xl">
                        <Calendar className="text-gym-primary" size={18} />
                        <span className="text-sm font-black text-gym-primary uppercase tracking-widest">
                            {format(selectedDate, "eeee, d 'de' MMMM", { locale: es })}
                        </span>
                    </div>
                    <button
                        onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
                        className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 p-2 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm max-w-md">
                <button
                    onClick={() => setActiveTab('members')}
                    className={cn(
                        "flex-1 py-3 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'members' 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                            : "text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                >
                    Socios
                </button>
                <button
                    onClick={() => setActiveTab('trainers')}
                    className={cn(
                        "flex-1 py-3 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'trainers' 
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                            : "text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                >
                    Entrenadores
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-500/20">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{activeTab === 'members' ? 'Total Ingresos' : 'Total Jornadas'}</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 border border-green-100 dark:border-green-500/20">
                        <Trophy size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{activeTab === 'members' ? 'Autorizados' : 'Puntuales'}</p>
                        <p className="text-3xl font-black text-green-500 leading-none mt-1">{stats.allowed}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-100 dark:border-red-500/20">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{activeTab === 'members' ? 'Denegados' : 'Tardanzas'}</p>
                        <p className="text-3xl font-black text-red-500 leading-none mt-1">{stats.denied}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gym-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-4">
                    {activeTab === 'members' && (
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-gym-primary/5 transition-all appearance-none min-w-[200px] text-slate-900 dark:text-white"
                            >
                                <option value="all" className="dark:bg-slate-900">Todas las clases</option>
                                <option value="no-class" className="dark:bg-slate-900">Sin clase (General)</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.name} className="dark:bg-slate-900">{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button
                        onClick={handlePrint}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform print:hidden"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm print:shadow-none print:border-none">
                <div className="overflow-x-auto">
                    {/* Print Header */}
                    <div className="hidden print:block mb-8 text-center">
                        
                        <p className="text-sm">{format(selectedDate, "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                        <p className="text-xs uppercase mt-2">Filtro: {selectedClass === 'all' ? 'Todas las clases' : selectedClass}</p>
                    </div>

                    <table className="w-full text-left print:text-[10px]">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeTab === 'members' ? 'Socio' : 'Entrenador'}</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora {activeTab === 'trainers' && 'Entrada'}</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeTab === 'members' ? 'Clase / Sesión' : 'Hora Salida'}</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeTab === 'members' ? 'Entrenador' : 'Clase Asignada'}</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {activeTab === 'members' ? (
                                filteredAttendances.map((att) => (
                                    <tr key={att.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center font-black text-slate-900 dark:text-white uppercase">
                                                    {att.member.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                                        {att.member.firstName} {att.member.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1 italic">DNI: {att.member.dni}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 font-bold text-xs">
                                                <Clock size={14} className="opacity-40" />
                                                {format(new Date(att.date), 'HH:mm:ss')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {att.schedule ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-gym-primary uppercase tracking-tight">{att.schedule.gymClass.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">Slot: {att.schedule.startTime} - {att.schedule.endTime}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Acceso General</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-gray-400">
                                            {att.schedule?.trainer.name || '---'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={cn(
                                                "inline-flex px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                att.accessAllowed
                                                    ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20"
                                                    : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                                            )}>
                                                {att.accessAllowed ? 'Autorizado' : 'Denegado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredTrainerAttendances.map((att) => (
                                    <tr key={att.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center font-black text-slate-900 dark:text-white uppercase">
                                                    {att.trainer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                                        {att.trainer.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1 italic">{att.trainer.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 font-bold text-xs">
                                                <Clock size={14} className="opacity-40" />
                                                {format(new Date(att.checkIn), 'HH:mm:ss')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 font-bold text-xs">
                                                {att.checkOut ? (
                                                    <>
                                                        <Clock size={14} className="opacity-40" />
                                                        {format(new Date(att.checkOut), 'HH:mm:ss')}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-300 italic">En curso...</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {att.schedule ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-gym-primary uppercase tracking-tight">{att.schedule.gymClass.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{att.schedule.startTime} - {att.schedule.endTime}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">---</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={cn(
                                                "inline-flex px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                att.status === 'PRESENT'
                                                    ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20"
                                                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                                            )}>
                                                {att.status === 'PRESENT' ? 'Puntual' : 'Tardanza'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {((activeTab === 'members' && filteredAttendances.length === 0) || (activeTab === 'trainers' && filteredTrainerAttendances.length === 0)) && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Users className="mx-auto text-gray-200 dark:text-gray-800 mb-4" size={48} strokeWidth={1} />
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">No se encontraron registros de asistencia</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    body { background: white !important; color: black !important; }
                    .print\\:hidden { display: none !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #eee !important; padding: 8px !important; }
                    aside, header, footer, .space-y-8 > :not(.bg-white):not(:last-child) { display: none !important; }
                    .bg-white { box-shadow: none !important; border: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .grid { display: none !important; } /* Hide stats bars in print */
                    .rounded-\\[3rem\\] { border-radius: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default AttendanceHistory;
