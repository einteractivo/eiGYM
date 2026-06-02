import React, { useEffect, useState } from 'react';
import {
    Users,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    ShoppingCart,
    Cake,
    TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DailyReportModal from '../components/DailyReportModal';
import GymClassService, { type Schedule } from '../services/GymClassService';
import SpecialClassService, { type SpecialClass } from '../services/SpecialClassService';

interface Stats {
    totalMembers: number;
    activeMemberships: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    attendanceToday: number;
    totalProducts: number;
    lowStockProducts: number;
    birthdaysToday: number;
}

interface Attendance {
    id: number;
    date: string;
    member: {
        firstName: string;
        lastName: string;
    };
}

const StatCard = ({ title, value, icon: Icon, trend, colorClass, bgColorClass }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-slate-900 transition-all group">
        <div className="flex justify-between items-start mb-8">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500", bgColorClass, colorClass)}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {trend && (
                <div className={cn(
                    "flex items-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm",
                    trend > 0 ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"
                )}>
                    {trend > 0 ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div className="space-y-1">
            <p className="text-slate-400 dark:text-gray-500 font-black text-[10px] tracking-widest uppercase italic">{title}</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">{value}</h3>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
    const [birthdaysToday, setBirthdaysToday] = useState<any[]>([]);
    const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [specialClasses, setSpecialClasses] = useState<SpecialClass[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashboardRes, schedulesData, specialClassesData] = await Promise.all([
                    api.get('/stats/dashboard'),
                    GymClassService.getAllSchedules().catch(() => []),
                    SpecialClassService.getAll().catch(() => [])
                ]);
                
                setStats(dashboardRes.data.stats);
                setRecentAttendances(dashboardRes.data.recentAttendances);
                setBirthdaysToday(dashboardRes.data.birthdaysToday || []);
                setTopSellingProducts(dashboardRes.data.topSellingProducts || []);
                setRecentSales(dashboardRes.data.recentSales || []);
                setSchedules(schedulesData || []);
                setSpecialClasses(specialClassesData || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getCurrentClass = () => {
        const day = currentTime.getDay(); // 0-6
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const nowStr = `${hours}:${minutes}`;

        // Find normal schedule matching day and time
        const currentSchedule = schedules.find(s => {
            if (!s.active) return false;
            if (s.dayOfWeek !== day) return false;
            return nowStr >= s.startTime && nowStr <= s.endTime;
        });

        if (currentSchedule) {
            return {
                type: 'normal',
                name: currentSchedule.gymClass?.name || 'Clase sin nombre',
                trainer: currentSchedule.trainer?.name || 'Sin asignar',
                startTime: currentSchedule.startTime,
                endTime: currentSchedule.endTime,
                color: currentSchedule.gymClass?.color || '#3b82f6',
            };
        }

        // Find special class matching day and time
        const currentSpecial = specialClasses.find(sc => {
            if (!sc.active) return false;
            if (sc.dayOfWeek !== day) return false;
            if (!sc.startTime || !sc.endTime) return false;
            return nowStr >= sc.startTime && nowStr <= sc.endTime;
        });

        if (currentSpecial) {
            return {
                type: 'special',
                name: currentSpecial.name,
                trainer: 'Clase Especial',
                startTime: currentSpecial.startTime,
                endTime: currentSpecial.endTime,
                color: currentSpecial.color || '#eab308',
            };
        }

        return null;
    };

    const getNextClass = (currentClassEndTime?: string) => {
        const day = currentTime.getDay(); // 0-6
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const nowStr = `${hours}:${minutes}`;

        // If there's a current class, search for classes starting after it ends.
        // Otherwise, search for classes starting after the current time.
        const referenceTime = currentClassEndTime || nowStr;

        const todayClasses: Array<{
            name: string;
            startTime: string;
            color: string;
            type: 'normal' | 'special';
        }> = [];

        schedules.forEach(s => {
            if (s.active && s.dayOfWeek === day && s.startTime >= referenceTime) {
                todayClasses.push({
                    name: s.gymClass?.name || 'Clase sin nombre',
                    startTime: s.startTime,
                    color: s.gymClass?.color || '#3b82f6',
                    type: 'normal',
                });
            }
        });

        specialClasses.forEach(sc => {
            if (sc.active && sc.dayOfWeek === day && sc.startTime && sc.startTime >= referenceTime) {
                todayClasses.push({
                    name: sc.name,
                    startTime: sc.startTime,
                    color: sc.color || '#eab308',
                    type: 'special',
                });
            }
        });

        if (todayClasses.length === 0) return null;

        // Sort chronologically by startTime
        todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

        return todayClasses[0];
    };

    const activeClass = getCurrentClass();
    const nextClass = getNextClass(activeClass?.endTime);

    if (loading) return null;

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300">
                <div className="flex-1 min-w-[200px]">
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Resumen general de tu gimnasio hoy</p>
                </div>

                <div className="flex-1 flex flex-col items-center gap-2.5 w-full md:w-auto">
                    {activeClass ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-6 py-4 rounded-[2rem] shadow-sm animate-in fade-in zoom-in duration-300 w-full sm:w-auto justify-center">
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className="w-3 h-3 rounded-full border border-white/10 shadow-sm animate-pulse"
                                            style={{ backgroundColor: activeClass.color }}
                                        />
                                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">
                                            {activeClass.type === 'special' ? 'Clase Especial' : 'Clase en curso'}
                                        </span>
                                    </div>
                                    <span className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight text-sm mt-0.5">
                                        {activeClass.name}
                                    </span>
                                </div>
                            </div>
                            <div className="hidden sm:block h-8 w-[1px] bg-gray-100 dark:bg-white/10" />
                            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0">
                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">Horario:</span>
                                <span className="font-bold text-slate-700 dark:text-gray-300 text-xs italic">
                                    {activeClass.startTime} - {activeClass.endTime}
                                </span>
                            </div>
                            <div className="hidden sm:block h-8 w-[1px] bg-gray-100 dark:bg-white/10" />
                            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0">
                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">Entrenador:</span>
                                <span className="font-bold text-slate-700 dark:text-gray-300 text-xs uppercase italic">
                                    {activeClass.trainer}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02] border border-gray-100/50 dark:border-white/5 px-6 py-4 rounded-[2rem] shadow-sm w-full sm:w-auto justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest italic leading-none">Clase en curso</span>
                                <span className="font-black text-gray-400 dark:text-gray-600 uppercase italic tracking-tight text-xs mt-1">
                                    Sin clases en este momento
                                </span>
                            </div>
                        </div>
                    )}

                    {nextClass && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider italic flex items-center gap-2 mt-1 opacity-70 hover:opacity-100 transition-opacity duration-300">
                            <span>Siguiente clase hoy:</span>
                            <span 
                                className="w-2 h-2 rounded-full border border-white/10 shadow-sm animate-pulse"
                                style={{ backgroundColor: nextClass.color }}
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-black">{nextClass.name}</span>
                            <span className="text-gray-400 dark:text-gray-500 font-medium">({nextClass.startTime} HS)</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 text-right min-w-[200px]">
                    <p className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Fecha de Hoy</p>
                    <p className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-tight italic">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                </div>
            </div>

            {birthdaysToday.length > 0 && (
                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-700">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 animate-bounce">
                            <Cake className="text-white" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">¡Cumpleaños de Hoy! 🎂</h2>
                            <p className="text-slate-500 dark:text-gray-400 font-bold text-sm">
                                Hoy celebran {birthdaysToday.length} {birthdaysToday.length === 1 ? 'socio' : 'socios'}. ¡No olvides saludarlos!
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {birthdaysToday.map((member) => (
                            <div key={member.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm hover:scale-105 transition-transform">
                                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                                <span className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight text-sm">
                                    {member.firstName} {member.lastName}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Miembros Activos"
                    value={stats?.totalMembers || 0}
                    icon={Users}
                    bgColorClass="bg-blue-50 group-hover:bg-blue-500 border-blue-100 group-hover:border-blue-500"
                    colorClass="text-blue-500 group-hover:text-white"
                    trend={12}
                />
                <StatCard
                    title="Ingresos del Mes"
                    value={`S/ ${Number(stats?.monthlyRevenue || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    bgColorClass="bg-green-50 group-hover:bg-green-500 border-green-100 group-hover:border-green-500"
                    colorClass="text-green-500 group-hover:text-white"
                />
                <StatCard
                    title="Gastos del Mes"
                    value={`S/ ${Number(stats?.monthlyExpenses || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={ArrowDownRight}
                    bgColorClass="bg-red-50 group-hover:bg-red-500 border-red-100 group-hover:border-red-500"
                    colorClass="text-red-500 group-hover:text-white"
                />
                <StatCard
                    title="Asistencias Hoy"
                    value={stats?.attendanceToday || 0}
                    icon={Calendar}
                    bgColorClass="bg-orange-50 group-hover:bg-orange-500 border-orange-100 group-hover:border-orange-500"
                    colorClass="text-orange-500 group-hover:text-white"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm transition-colors duration-300">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-100 dark:border-orange-500/20">
                                <Clock className="text-orange-500" size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Asistencias Recientes</h2>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest italic mt-0.5">Últimos movimientos hoy</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/attendance')}
                            className="bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-white text-slate-400 dark:text-gray-500 hover:text-white dark:hover:text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-100 dark:border-white/10 italic"
                        >
                            Ver Todo
                        </button>
                    </div>

                    <div className="space-y-6">
                        {recentAttendances.length > 0 ? recentAttendances.map((att) => (
                            <div key={att.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-none transition-all border border-transparent hover:border-gray-50 dark:hover:border-white/10 group">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center font-black text-slate-900 dark:text-white text-xl italic transition-all group-hover:scale-110 group-hover:bg-gym-primary group-hover:text-white group-hover:border-gym-primary">
                                        {att.member.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white leading-none mb-2 text-lg uppercase tracking-tight italic">{att.member.firstName} {att.member.lastName}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/20"></span>
                                            <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] font-black italic">Acceso Verificado</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter italic">
                                        {format(new Date(att.date), 'HH:mm', { locale: es })}
                                    </p>
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] italic">Hora Check-in</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center text-gray-200 dark:text-gray-800">
                                <Clock size={48} strokeWidth={1} className="mx-auto mb-4 opacity-50" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic">Aún no hay asistencias hoy</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group transition-colors duration-300">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform group-hover:opacity-[0.07] dark:group-hover:opacity-[0.1]">
                            <ShoppingCart className="text-slate-900 dark:text-white w-48 h-48" strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-8">Acceso Rápido</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => navigate('/pos')}
                                    className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-none uppercase tracking-widest text-xs active:scale-95"
                                >
                                    <ShoppingCart size={18} strokeWidth={3} />
                                    Terminal de Venta
                                </button>
                                <button
                                    onClick={() => navigate('/members', { state: { openModal: true } })}
                                    className="w-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all border border-gray-100 dark:border-white/10 uppercase tracking-widest text-[10px] active:scale-95"
                                >
                                    <Users size={16} strokeWidth={3} />
                                    Nuevo Miembro
                                </button>
                                <button
                                    onClick={() => navigate('/payments')}
                                    className="w-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all border border-gray-100 dark:border-white/10 uppercase tracking-widest text-[10px] active:scale-95"
                                >
                                    <DollarSign size={16} strokeWidth={3} />
                                    Caja y Pagos
                                </button>
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="w-full bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all border border-orange-100 dark:border-orange-500/10 uppercase tracking-widest text-[10px] active:scale-95"
                                >
                                    <Calendar size={16} strokeWidth={3} />
                                    Reporte Diario
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gym-primary rounded-[3rem] p-10 shadow-xl shadow-gym-primary/20 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer"
                        onClick={() => navigate('/attendance', { state: { kiosk: true } })}>
                        <div className="relative z-10">
                            <h3 className="text-white font-black text-2xl uppercase italic tracking-tight mb-2">Modo Kiosko</h3>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest italic mb-6">Autoservicio de acceso</p>
                            <span className="inline-block bg-white text-gym-primary font-black px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg">
                                Activar Ahora
                            </span>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>

            {/* Métricas de Tienda */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Más Vendidos */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm transition-colors duration-300">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-pink-50 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-100 dark:border-pink-500/20">
                                <TrendingUp className="text-pink-500" size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Productos Más Vendidos</h2>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest italic mt-0.5">Top ventas acumuladas</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-white text-slate-400 dark:text-gray-500 hover:text-white dark:hover:text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-100 dark:border-white/10 italic"
                        >
                            Ver Inventario
                        </button>
                    </div>

                    <div className="space-y-6">
                        {topSellingProducts.length > 0 ? (
                            topSellingProducts.map((prod, index) => (
                                <div key={prod.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-none transition-all border border-transparent hover:border-gray-50 dark:hover:border-white/10 group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center font-black text-slate-900 dark:text-white text-xl italic transition-all group-hover:scale-110">
                                            {index + 1}°
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white leading-none mb-2 text-lg uppercase tracking-tight italic">{prod.name}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase tracking-wider font-black italic">Precio: S/ {Number(prod.price).toFixed(2)}</span>
                                                <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase tracking-wider font-black italic">Stock: {prod.stock} u.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-pink-500 dark:text-pink-400 text-2xl tracking-tighter italic">
                                            {prod.totalSold} vendidos
                                        </p>
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] italic">Total Recaudado: S/ {prod.totalRevenue.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center text-gray-200 dark:text-gray-800">
                                <TrendingUp size={48} strokeWidth={1} className="mx-auto mb-4 opacity-50" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic">Aún no hay registro de ventas</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resumen Tienda / Últimas Ventas */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 shadow-sm transition-colors duration-300">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-8">Últimas Ventas</h2>
                    <div className="space-y-6">
                        {recentSales.length > 0 ? (
                            recentSales.map((sale) => (
                                <div key={sale.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100/50 dark:border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{sale.memberName}</p>
                                            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black">{format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                                        </div>
                                        <span className="text-xs font-black text-green-500 dark:text-green-400 italic">S/ {Number(sale.total).toFixed(2)}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {sale.items.map((item: any) => (
                                            <p key={item.id} className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase italic tracking-tight">
                                                • {item.productName} ({item.quantity} x S/ {item.priceAtSale.toFixed(2)})
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center text-gray-200 dark:text-gray-800">
                                <ShoppingCart size={48} strokeWidth={1} className="mx-auto mb-4 opacity-50" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic">Sin ventas registradas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DailyReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
