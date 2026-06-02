import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Users,
    Download,
    Medal,
    Star
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';

interface RankingMember {
    rank: number;
    memberId: number;
    name: string;
    dni: string;
    photoUrl: string | null;
    attendanceCount: number;
}

const AttendanceRanking: React.FC = () => {
    const [ranking, setRanking] = useState<RankingMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'all' | 'month' | 'week'>('month');

    useEffect(() => {
        fetchRanking();
    }, [period]);

    const fetchRanking = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/ranking?period=${period}`);
            setRanking(response.data);
        } catch (error) {
            console.error('Error fetching ranking:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="text-yellow-400" size={24} />;
            case 2: return <Medal className="text-slate-300" size={24} />;
            case 3: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="text-sm font-black text-gray-400">#{rank}</span>;
        }
    };

    const getPeriodLabel = () => {
        switch (period) {
            case 'all': return 'Histórico';
            case 'month': return 'Este Mes';
            case 'week': return 'Esta Semana';
            default: return '';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <Trophy className="text-gym-primary" size={28} />
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Ranking de Asistencias</h2>
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Los miembros con mayor compromiso y constancia</p>
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

            {/* Top 3 Podium */}
            {!loading && ranking.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-10">
                    {/* Rank 2 */}
                    <div className="order-2 md:order-1 flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-700 delay-100">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-white/5 border-2 border-slate-300 flex items-center justify-center overflow-hidden">
                                {ranking[1].photoUrl ? (
                                    <img src={ranking[1].photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="text-slate-300" size={40} />
                                )}
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
                                <Medal className="text-slate-400" size={20} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic truncate max-w-[150px]">{ranking[1].name}</p>
                            <p className="text-gym-primary font-black text-2xl">{ranking[1].attendanceCount}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Asistencias</p>
                        </div>
                        <div className="w-full h-24 bg-slate-100/50 dark:bg-white/5 rounded-t-[2rem] border-x border-t border-slate-200 dark:border-white/10 flex items-center justify-center">
                            <span className="text-4xl font-black text-slate-300 italic">2</span>
                        </div>
                    </div>

                    {/* Rank 1 */}
                    <div className="order-1 md:order-2 flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-1000">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-yellow-50 dark:bg-yellow-500/10 border-4 border-yellow-400 flex items-center justify-center overflow-hidden shadow-2xl shadow-yellow-500/20">
                                {ranking[0].photoUrl ? (
                                    <img src={ranking[0].photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="text-yellow-400" size={50} />
                                )}
                            </div>
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-[1.25rem] flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl animate-bounce">
                                <Trophy className="text-white" size={24} />
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Star className="text-yellow-400 fill-yellow-400" size={16} />
                                <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic truncate max-w-[200px]">{ranking[0].name}</p>
                                <Star className="text-yellow-400 fill-yellow-400" size={16} />
                            </div>
                            <p className="text-gym-primary font-black text-4xl mt-1">{ranking[0].attendanceCount}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Asistencias</p>
                        </div>
                        <div className="w-full h-40 bg-yellow-400/10 dark:bg-yellow-400/5 rounded-t-[2.5rem] border-x border-t border-yellow-400/20 flex items-center justify-center relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent opacity-50" />
                            <span className="text-6xl font-black text-yellow-400 italic relative z-10 font-outline-yellow">1</span>
                        </div>
                    </div>

                    {/* Rank 3 */}
                    <div className="order-3 md:order-3 flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-700 delay-200">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-600 flex items-center justify-center overflow-hidden">
                                {ranking[2].photoUrl ? (
                                    <img src={ranking[2].photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="text-amber-600" size={40} />
                                )}
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
                                <Medal className="text-white" size={20} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic truncate max-w-[150px]">{ranking[2].name}</p>
                            <p className="text-gym-primary font-black text-2xl">{ranking[2].attendanceCount}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Asistencias</p>
                        </div>
                        <div className="w-full h-16 bg-amber-900/5 dark:bg-white/5 rounded-t-[2rem] border-x border-t border-amber-600/20 flex items-center justify-center">
                            <span className="text-4xl font-black text-amber-600/50 italic">3</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Rest of the List */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">Clasificación General</h3>
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1 italic">Periodo: {getPeriodLabel()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-gym-primary animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">En vivo</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Puesto</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Socio</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">DNI</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Asistencias</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {ranking.map((row) => (
                                <tr key={row.memberId} className={cn(
                                    "group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors",
                                    row.rank <= 3 ? "bg-gym-primary/[0.02]" : ""
                                )}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center">
                                            {getRankIcon(row.rank)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-white uppercase overflow-hidden",
                                                row.rank === 1 ? "bg-yellow-400" : row.rank === 2 ? "bg-slate-300" : row.rank === 3 ? "bg-amber-600" : "bg-gray-100 dark:bg-white/10 text-slate-900 dark:text-white"
                                            )}>
                                                {row.photoUrl ? (
                                                    <img src={row.photoUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    row.name.charAt(0)
                                                )}
                                            </div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {row.name}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        {row.dni}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-sm font-black text-gym-primary bg-gym-primary/10 px-4 py-2 rounded-full border border-gym-primary/20">
                                            {row.attendanceCount}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {ranking.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Trophy className="mx-auto text-gray-200 dark:text-gray-800 mb-4" size={48} strokeWidth={1} />
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Aún no hay datos de asistencia para este periodo</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .font-outline-yellow {
                    -webkit-text-stroke: 1px rgba(250, 204, 21, 0.5);
                }
                @media print {
                    @page { size: auto; margin: 10mm; }
                    body { background: white !important; color: black !important; }
                    .print\\:hidden { display: none !important; }
                    aside, header, footer { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .bg-white { box-shadow: none !important; border: none !important; }
                    .rounded-\\[2.5rem\\], .rounded-\\[3.5rem\\] { border-radius: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default AttendanceRanking;
