import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Download,
    Dumbbell
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

interface ClassStat {
    id: number;
    name: string;
    color: string | null;
    count: number;
}

const AttendanceStats: React.FC = () => {
    const [stats, setStats] = useState<ClassStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'all' | 'month' | 'week'>('month');

    useEffect(() => {
        fetchStats();
    }, [period]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/by-class?period=${period}`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalAttendances = stats.reduce((acc, s) => acc + s.count, 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <BarChart3 className="text-gym-primary" size={28} />
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Asistencias por Clase</h2>
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Análisis de popularidad y recurrencia por actividad</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-50 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-white/10">
                        {(['week', 'month', 'all'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    period === p
                                        ? "bg-white dark:bg-white/10 text-gym-primary shadow-sm"
                                        : "text-gray-400 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Histórico'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handlePrint}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Total Stats Card */}
                <div className="bg-gym-primary p-10 rounded-[3rem] shadow-2xl shadow-gym-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] italic">Total Asistencias Registradas</p>
                        <p className="text-7xl font-black text-white mt-4 italic">{totalAttendances}</p>
                        <div className="mt-8 flex items-center gap-3">
                             <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md">
                                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">En {period === 'all' ? 'total' : period === 'month' ? '30 días' : '7 días'}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bars List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Distribución de Actividades</h3>
                        <div className="flex items-center gap-2">
                             <PieChart className="text-gray-400" size={18} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Porcentaje de ocupación</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {stats.map((item) => {
                            const percentage = totalAttendances > 0 ? (item.count / totalAttendances) * 100 : 0;
                            return (
                                <div key={item.id} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-4 h-4 rounded-full shadow-sm" 
                                                style={{ backgroundColor: item.color || '#F87171' }}
                                            />
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-slate-900 dark:text-white">{item.count}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">({percentage.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-gray-100 dark:border-white/10">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                                            style={{ 
                                                width: `${percentage}%`, 
                                                backgroundColor: item.color || '#F87171' 
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {stats.length === 0 && !loading && (
                            <div className="py-20 text-center">
                                <Dumbbell className="mx-auto text-gray-200 dark:text-gray-800 mb-4" size={48} strokeWidth={1} />
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">No hay clases registradas en este periodo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actividad / Clase</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Frecuencia Mensual</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Asistencias</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {stats.map((row) => (
                                <tr key={row.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                                                style={{ backgroundColor: row.color || '#F87171' }}
                                            >
                                                <Dumbbell size={18} />
                                            </div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                                {row.name}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                             <div className="w-24 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                 <div 
                                                    className="h-full bg-gym-primary" 
                                                    style={{ width: `${(row.count / totalAttendances) * 100}%` }}
                                                 />
                                             </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-lg font-black text-slate-900 dark:text-white italic">
                                            {row.count}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    body { background: white !important; color: black !important; }
                    .print\\:hidden { display: none !important; }
                    aside, header, footer { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .bg-white { box-shadow: none !important; border: none !important; }
                    .rounded-\\[2.5rem\\], .rounded-\\[3rem\\] { border-radius: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default AttendanceStats;
