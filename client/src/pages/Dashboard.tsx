import React, { useEffect, useState } from 'react';
import {
    Users,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Clock,
    Archive,
    AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DailyReportModal from '../components/DailyReportModal';

interface Stats {
    totalMembers: number;
    activeMemberships: number;
    monthlyRevenue: number;
    attendanceToday: number;
    totalProducts: number;
    lowStockProducts: number;
}

interface Attendance {
    id: number;
    date: string;
    member: {
        firstName: string;
        lastName: string;
    };
}

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-black/20 backdrop-blur-md border border-white/5 p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-2xl", color)}>
                <Icon size={24} className="text-white" />
            </div>
            {trend && (
                <div className={cn(
                    "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                    trend > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                    {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <p className="text-gray-400 font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
    </div>
);

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/stats/dashboard');
                setStats(response.data.stats);
                setRecentAttendances(response.data.recentAttendances);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-400 mt-1">Resumen del rendimiento de tu gym hoy</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Miembros Activos"
                    value={stats?.totalMembers || 0}
                    icon={Users}
                    color="bg-blue-500"
                    trend={12}
                />
                <StatCard
                    title="Membresías Vigentes"
                    value={stats?.activeMemberships || 0}
                    icon={Activity}
                    color="bg-purple-500"
                    trend={5}
                />
                <StatCard
                    title="Productos en Tienda"
                    value={stats?.totalProducts || 0}
                    icon={Archive}
                    color="bg-orange-500"
                    trend={stats?.lowStockProducts ? -stats.lowStockProducts : undefined}
                />
                <StatCard
                    title="Ingresos del Mes"
                    value={`S/ ${Number(stats?.monthlyRevenue || 0).toFixed(2)}`}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <StatCard
                    title="Asistencias Hoy"
                    value={stats?.attendanceToday || 0}
                    icon={Calendar}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Clock className="text-gym-primary" />
                            <h2 className="text-xl font-bold">Asistencias Recientes</h2>
                        </div>
                        <button className="text-gym-primary hover:underline text-sm font-medium">Ver todo</button>
                    </div>

                    <div className="space-y-4">
                        {recentAttendances.map((att) => (
                            <div key={att.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center font-bold">
                                        {att.member.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{att.member.firstName} {att.member.lastName}</p>
                                        <p className="text-sm text-gray-400">Manual</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">
                                    {format(new Date(att.date), 'HH:mm', { locale: es })}
                                </p>
                            </div>
                        ))}
                        {recentAttendances.length === 0 && (
                            <p className="text-center text-gray-500 py-8 italic">No hay asistencias registradas hoy</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Useful info */}
                <div className="bg-gym-primary/10 border border-gym-primary/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => navigate('/members', { state: { openModal: true } })}
                                className="bg-gym-primary px-4 py-3 rounded-xl font-bold hover:bg-gym-primary/90 transition-colors text-white"
                            >
                                Registrar Miembro
                            </button>
                            <button
                                onClick={() => navigate('/payments')}
                                className="bg-white/10 px-4 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors text-white text-left"
                            >
                                Nueva Venta
                            </button>
                            <button
                                onClick={() => navigate('/schedules')}
                                className="bg-white/10 px-4 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors text-white text-left"
                            >
                                Ver Horarios
                            </button>
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="bg-white/10 px-4 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors text-white text-left"
                            >
                                Reporte Diario
                            </button>
                        </div>
                    </div>
                    {/* Decoration */}
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-gym-primary rounded-full blur-[80px] opacity-20" />
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
