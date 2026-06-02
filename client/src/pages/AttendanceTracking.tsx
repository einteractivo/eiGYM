import React, { useState, useEffect } from 'react';
import {
    Fingerprint,
    ScanLine,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, UserCheck } from 'lucide-react';

interface AttendanceRecord {
    id: number;
    date: string;
    accessAllowed: boolean;
    member: {
        firstName: string;
        lastName: string;
        dni: string;
    };
}

const AttendanceTracking: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [lastRes, setLastRes] = useState<any>(null);
    const [recentAttendances, setRecentAttendances] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isKioskMode, setIsKioskMode] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
    const [now, setNow] = useState(new Date());
    const [trainers, setTrainers] = useState<any[]>([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
    const [trainerHistory, setTrainerHistory] = useState<any[]>([]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000); // Cada 30 segs
        return () => clearInterval(timer);
    }, []);

    const fetchAttendances = async () => {
        try {
            const response = await api.get('/attendance');
            setRecentAttendances(response.data);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        }
    };

    useEffect(() => {
        fetchAttendances();
        fetchSchedules();
        fetchTrainers();
        fetchTrainerHistory();
    }, []);

    const fetchTrainerHistory = async () => {
        try {
            const response = await api.get('/trainer-attendance/history');
            setTrainerHistory(response.data);
        } catch (error) {
            console.error('Error fetching trainer history:', error);
        }
    };

    const fetchTrainers = async () => {
        try {
            const response = await api.get('/users');
            setTrainers(response.data.filter((u: any) => u.role === 'TRAINER'));
        } catch (error) {
            console.error('Error fetching trainers:', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/schedules');
            // Filter only active schedules for Today
            const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
            const todaySchedules = response.data.filter((s: any) => s.dayOfWeek === today && s.active);
            setSchedules(todaySchedules);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (identifier.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                const response = await api.get(`/members?search=${identifier}`);
                setSuggestions(response.data);
                setShowSuggestions(response.data.length > 0);
            } catch (error) {
                console.error('Error fetching member suggestions:', error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [identifier]);

    // Biometric Logic Extracted for reuse
    const performBiometricScan = async () => {
        if (isScanning) return;
        setIsScanning(true);
        setError('');

        try {
            // 1. Get all members to have their Fingerprint IDs
            const membersRes = await api.get('/members');
            const members = membersRes.data;
            const fingerprintIds = members
                .filter((m: any) => m.fingerprintId)
                .map((m: any) => m.fingerprintId);

            if (fingerprintIds.length === 0) {
                throw new Error('No hay huellas registradas en el sistema.');
            }

            const { verifyBiometric } = await import('../lib/biometrics');

            // 2. Start 1:N Scan (Pass all known IDs)
            const credentialId = await verifyBiometric(fingerprintIds);

            // 3. Find who it belongs to
            const member = members.find((m: any) => m.fingerprintId === credentialId);

            if (member) {
                setLoading(true);
                setLastRes(null);
                try {
                    const response = await api.post('/attendance/register', {
                        identifier: member.dni,
                        method: 'BIOMETRIC',
                        scheduleId: selectedScheduleId || null
                    });
                    setLastRes(response.data);
                    setIdentifier('');
                    fetchAttendances();

                    // In normal mode, clear after 5s. In Kiosk, the effect handles it.
                    if (!isKioskMode) {
                        setTimeout(() => setLastRes(null), 5000);
                    }
                } catch (submitErr: any) {
                    setError(submitErr.response?.data?.message || 'Error al registrar asistencia');
                } finally {
                    setLoading(false);
                }
            } else {
                setError('Huella reconocida pero no asociada a ningún miembro activo.');
            }
        } catch (err: any) {
            console.error(err);
            let msg = err.message || 'Error de lectura biométrica';
            if (msg.includes('timed out')) msg = 'Tiempo de espera agotado.';
            if (msg.includes('not allowed') || msg.includes('canceled')) msg = 'Lectura cancelada.';
            setError(msg);

            // In kiosk mode, we don't want to show errors forever
            if (isKioskMode) {
                setTimeout(() => setError(''), 3000);
            }
        } finally {
            setIsScanning(false);
        }
    };

    // Kiosk Mode Auto-Scan Loop
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        if (isKioskMode && !isScanning && !loading) {
            // If we have a result (Success/Error), wait 3 seconds before next scan
            const delay = (lastRes || error) ? 3000 : 500;

            timeout = setTimeout(() => {
                if (lastRes) setLastRes(null);
                if (error) setError('');
                performBiometricScan();
            }, delay);
        }

        return () => clearTimeout(timeout);
    }, [isKioskMode, isScanning, loading, !!lastRes, !!error]);

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier) return;

        setLoading(true);
        setError('');
        setLastRes(null);

        try {
            const response = await api.post('/attendance/register', {
                identifier,
                method: 'MANUAL',
                scheduleId: selectedScheduleId || null
            });
            setLastRes(response.data);
            setIdentifier('');
            fetchAttendances();

            setTimeout(() => setLastRes(null), 5000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al registrar asistencia');
        } finally {
            setLoading(false);
        }
    };

    const handleTrainerCheck = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
        if (!selectedTrainerId) {
            setError('Seleccione un entrenador');
            return;
        }

        setLoading(true);
        setError('');
        setLastRes(null);

        try {
            const response = await api.post('/trainer-attendance/register', {
                trainerId: selectedTrainerId,
                action
            });

            const trainerName = trainers.find(t => t.id === parseInt(selectedTrainerId))?.name || 'Entrenador';

            setLastRes({
                allowed: true,
                message: response.data.message,
                member: { name: trainerName }
            });

            fetchTrainerHistory();
            setTimeout(() => setLastRes(null), 5000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al registrar asistencia de entrenador');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMember = (member: any) => {
        setIdentifier(member.dni);
        setSuggestions([]);
        setShowSuggestions(false);
        // Automatically submit if a member is selected?
        // Let's just set the ID and let the user click confirm, or we can trigger it.
        // The user asked to "put the option to search by name", usually this implies selection.
    };

    if (isKioskMode) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-700 overflow-hidden transition-colors duration-500">
                {/* Background Decoration */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gym-primary/5 dark:bg-gym-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px]" />

                <button
                    onClick={() => setIsKioskMode(false)}
                    className="absolute top-8 right-8 text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-5 py-3 rounded-2xl border border-gray-100 dark:border-white/10 hover:shadow-md font-black uppercase tracking-widest text-[10px]"
                >
                    <XCircle size={18} />
                    <span>Salir de Quiosco</span>
                </button>

                <div className="w-full max-w-4xl space-y-16 text-center relative z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-6 py-2 rounded-full border border-gray-100 dark:border-white/10 mb-4 shadow-sm">
                            <div className="w-2 h-2 bg-gym-primary rounded-full animate-pulse" />
                            <span className="text-slate-400 dark:text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Acceso Biométrico Activo</span>
                        </div>
                        <h1 className="text-7xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">
                            CENTROM <span className="text-gym-primary italic">eiGYM</span>
                        </h1>
                        <p className="text-2xl text-slate-500 dark:text-gray-400 font-medium">Sitúe su huella dactilar sobre el sensor</p>
                    </div>

                    <div className={cn(
                        "aspect-square w-80 h-80 mx-auto rounded-[80px] flex items-center justify-center transition-all duration-700 border-8 relative bg-white dark:bg-slate-900",
                        lastRes?.allowed ? "border-green-500 shadow-[0_20px_60px_rgba(34,197,94,0.15)]" :
                            lastRes?.allowed === false ? "border-red-500 shadow-[0_20px_60px_rgba(239,68,68,0.15)]" :
                                isScanning ? "border-gym-primary shadow-[0_20px_60px_rgba(255,76,66,0.1)]" : "border-gray-50 dark:border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.03)] dark:shadow-none"
                    )}>
                        <div className="absolute inset-0 rounded-[72px] bg-gradient-to-tr from-gray-50 to-transparent opacity-50" />
                        {lastRes?.allowed ? (
                            <div className="bg-green-500 w-48 h-48 rounded-full shadow-2xl animate-in zoom-in duration-300 flex items-center justify-center">
                                <CheckCircle2 size={100} className="text-white" />
                            </div>
                        ) : lastRes?.allowed === false ? (
                            <div className="bg-red-500 w-48 h-48 rounded-full shadow-2xl animate-in zoom-in duration-300 flex items-center justify-center">
                                <XCircle size={100} className="text-white" />
                            </div>
                        ) : (
                            <Fingerprint size={140} className={cn("transition-all duration-500", isScanning ? "text-gym-primary scale-110" : "text-gray-100")} />
                        )}
                    </div>

                    <div className="min-h-[240px] flex flex-col items-center justify-center">
                        {lastRes ? (
                            <div className="animate-in zoom-in duration-300 space-y-4">
                                <h2 className={cn(
                                    "text-7xl font-black uppercase tracking-tighter italic",
                                    lastRes.allowed ? "text-green-500" : "text-red-500"
                                )}>
                                    {lastRes.allowed ? '¡BIENVENIDO!' : 'SIN ACCESO'}
                                </h2>
                                <div className="space-y-1">
                                    <p className="text-5xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-4">{lastRes.member.name}</p>
                                    <p className="text-xl text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">{lastRes.message}</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="animate-in shake duration-300">
                                <p className="text-3xl text-red-500 font-black bg-red-50 dark:bg-red-500/10 px-12 py-6 rounded-[2.5rem] border-2 border-red-100 dark:border-red-500/20 uppercase tracking-tight shadow-xl shadow-red-100/20 dark:shadow-none">
                                    {error}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-8">
                                <div className="flex gap-4">
                                    <div className="w-4 h-4 bg-gym-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-4 h-4 bg-gym-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-4 h-4 bg-gym-primary rounded-full animate-bounce" />
                                </div>
                                <p className="text-2xl text-slate-200 dark:text-gray-800 font-black uppercase tracking-[0.4em]">ESPERANDO ACCIÓN</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                    <div className="flex items-center gap-8 bg-white/20 dark:bg-white/[0.02] backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-500">
                        <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2rem] flex items-center justify-center shadow-2xl">
                            <Clock className="text-white dark:text-slate-900" size={40} />
                        </div>
                        <div className="text-left space-y-1">
                            <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                {format(new Date(), 'HH:mm')}
                            </p>
                            <p className="text-sm text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] font-black italic">
                                {format(new Date(), 'EEEE, d MMMM', { locale: es })}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-black tracking-widest uppercase text-slate-300 dark:text-gray-700">eiGYM Control v2.0</p>
                        <p className="text-[10px] font-black tracking-widest uppercase text-gym-primary mt-1 italic">NODO DE ACCESO BIOMÉTRICO</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500 pb-12">
            {/* Left Column: Registration Sections */}
            <div className="space-y-12">
                {/* Header & Kiosk Toggle */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Control de Acceso</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Panel administrativo de asistencia</p>
                    </div>
                    <button
                        onClick={() => setIsKioskMode(true)}
                        className="w-full sm:w-auto bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 font-black shadow-xl shadow-slate-200 dark:shadow-none uppercase tracking-widest text-xs"
                    >
                        <ScanLine size={18} strokeWidth={2.5} />
                        <span>Modo Quiosco</span>
                    </button>
                </div>

                {/* Trainer Attendance Section */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group transition-colors duration-300">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform">
                        <Users className="text-slate-900 dark:text-white w-40 h-40" strokeWidth={1} />
                    </div>

                    <div className="relative z-10 mb-8 flex items-center gap-4">
                        <div className="p-3 bg-gym-primary/10 rounded-2xl text-gym-primary">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Entrenadores</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest italic">Check-in / Check-out según horario</p>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">
                                SELECCIONAR ENTRENADOR
                            </label>
                            <select
                                value={selectedTrainerId}
                                onChange={(e) => setSelectedTrainerId(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold appearance-none cursor-pointer"
                            >
                                <option value="" className="dark:bg-slate-900">Seleccionar...</option>
                                {trainers.map(t => (
                                    <option key={t.id} value={t.id} className="dark:bg-slate-900">
                                        {t.name} ({t.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleTrainerCheck('CHECK_IN')}
                                disabled={loading || !selectedTrainerId}
                                className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                <Clock size={16} />
                                Entrada
                            </button>
                            <button
                                onClick={() => handleTrainerCheck('CHECK_OUT')}
                                disabled={loading || !selectedTrainerId}
                                className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black py-4 rounded-2xl border border-gray-200 dark:border-white/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                <Clock size={16} />
                                Salida
                            </button>
                        </div>
                    </div>
                </div>

                {/* Member Check-in Section */}
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group transition-colors duration-300">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform group-hover:opacity-[0.07] dark:group-hover:opacity-[0.1]">
                        <Fingerprint className="text-slate-900 dark:text-white w-48 h-48" strokeWidth={1} />
                    </div>

                    <div className="relative z-10 mb-8 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                            SELECCIONAR CLASE (OPCIONAL)
                        </label>
                        <select
                            value={selectedScheduleId}
                            onChange={(e) => setSelectedScheduleId(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] py-4 px-6 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold appearance-none cursor-pointer"
                        >
                            <option value="" className="dark:bg-slate-900">Acceso General (Sin Clase)</option>
                            {schedules.filter(s => {
                                const [startH, startM] = s.startTime.split(':').map(Number);
                                const [endH, endM] = s.endTime.split(':').map(Number);
                                const nowH = now.getHours();
                                const nowM = now.getMinutes();
                                const currentMinutes = nowH * 60 + nowM;
                                const startMinutes = startH * 60 + startM - 15; // 15 min de anticipación
                                const endMinutes = endH * 60 + endM;
                                return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
                            }).map(s => (
                                <option key={s.id} value={s.id} className="dark:bg-slate-900">
                                    {s.gymClass.name} - {s.startTime} ({s.trainer.name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleCheckIn} className="relative z-10 space-y-10">
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className={cn(
                                "w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 transition-all duration-700 shadow-2xl border-4",
                                lastRes?.allowed ? "bg-green-500 border-green-50 dark:border-green-500 shadow-green-100 dark:shadow-none scale-110" :
                                    lastRes?.allowed === false ? "bg-red-500 border-red-50 dark:border-red-500 shadow-red-100 dark:shadow-none scale-110" :
                                        "bg-gray-50 dark:bg-white/5 border-white dark:border-white/10 text-slate-200 dark:text-gray-800"
                            )}>
                                {lastRes?.allowed ? <CheckCircle2 size={64} className="text-white" strokeWidth={2.5} /> :
                                    lastRes?.allowed === false ? <XCircle size={64} className="text-white" strokeWidth={2.5} /> :
                                        <ScanLine size={64} strokeWidth={1.5} className={cn(isScanning && "animate-pulse text-gym-primary")} />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Scanner de Identidad</h2>
                            <p className="text-slate-400 dark:text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 italic">Procesando Identificación Biométrica</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={24} />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="DNI o Nombre..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[2rem] py-7 pl-16 pr-8 text-2xl text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-8 focus:ring-gym-primary/5 transition-all font-black tracking-tighter"
                                    autoFocus
                                />

                                {showSuggestions && (
                                    <div className="absolute left-0 right-0 top-full mt-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            {suggestions.map((member) => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => handleSelectMember(member)}
                                                    className="w-full text-left px-10 py-6 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight group-hover:text-gym-primary transition-colors">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold tracking-widest uppercase mt-0.5 italic">DNI: {member.dni}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                        member.status === 'ACTIVE' ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                                                    )}>
                                                        {member.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={performBiometricScan}
                                disabled={isScanning}
                                className={cn(
                                    "px-8 py-6 rounded-[2rem] transition-all flex flex-col items-center justify-center min-w-[140px] shadow-sm active:scale-95 group/bio",
                                    isScanning ? "bg-gym-primary text-white cursor-not-allowed shadow-gym-primary/20" : "bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 hover:border-gym-primary/30 text-slate-300 dark:text-gray-600 hover:text-gym-primary"
                                )}
                                title="Escanear Huella"
                            >
                                <Fingerprint size={36} className={cn(isScanning && "animate-pulse")} strokeWidth={1.5} />
                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">{isScanning ? 'Sync...' : 'Biometría'}</span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 font-black py-7 rounded-[2.5rem] shadow-2xl shadow-slate-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-xl uppercase tracking-widest"
                        >
                            {loading ? <div className="w-8 h-8 border-4 border-white dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" /> : 'Confirmar Ingreso'}
                        </button>

                        {error && (
                            <div className="flex items-center gap-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 p-8 rounded-[2.5rem] animate-in slide-in-from-top-4 shadow-xl shadow-red-100/20 dark:shadow-none">
                                <AlertCircle size={24} className="flex-shrink-0" strokeWidth={2.5} />
                                <span className="font-black text-xs uppercase tracking-tight leading-relaxed">{error}</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Result Message Container */}
                <div className="min-h-[160px]">
                    {lastRes && (
                        <div className={cn(
                            "p-10 rounded-[3rem] border shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700",
                            lastRes.allowed
                                ? "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400 shadow-green-100/50 dark:shadow-none"
                                : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400 shadow-red-100/50 dark:shadow-none"
                        )}>
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800",
                                    lastRes.allowed ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                )}>
                                    {lastRes.allowed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{lastRes.allowed ? '¡BIENVENIDO!' : 'ACCESO DENEGADO'}</h3>
                                    <p className="text-xl font-black uppercase mt-2 leading-none text-slate-900 dark:text-white">{lastRes.member.name}</p>
                                </div>
                            </div>
                            <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full", lastRes.allowed ? "bg-green-500" : "bg-red-500")} />
                                {lastRes.message}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent History Section */}
            <div className="space-y-10">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between transition-colors duration-300">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Historial de Hoy</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Actividad de las últimas horas</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 dark:text-gray-600 border border-gray-100 dark:border-white/10">
                        <Clock size={20} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] overflow-hidden shadow-sm transition-colors duration-300">
                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                        {recentAttendances.map((att) => (
                            <div key={att.id} className="p-8 flex items-center justify-between hover:bg-gray-50/5 dark:hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-sm border-2",
                                        att.accessAllowed
                                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                                    )}>
                                        {att.member.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-base uppercase tracking-tight group-hover:text-gym-primary transition-colors">{att.member.firstName} {att.member.lastName}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold tracking-widest uppercase mt-1 italic">DNI: {att.member.dni}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-white/10 group-hover:border-gym-primary/20 transition-all shadow-sm">
                                        <Clock size={14} className="text-slate-300 dark:text-gray-600" />
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-400 leading-none">{format(new Date(att.date), 'HH:mm:ss')}</span>
                                    </div>
                                    <div className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg border",
                                        att.accessAllowed
                                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                                    )}>
                                        {att.accessAllowed ? 'Autorizado' : 'Denegado'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentAttendances.length === 0 && (
                            <div className="py-32 text-center text-gray-200 dark:text-gray-800 flex flex-col items-center gap-6">
                                <ScanLine size={64} strokeWidth={1} className="opacity-50" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No hay registros para la fecha actual</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trainer History Section */}
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between transition-colors duration-300 mt-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Asistencia Entrenadores</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Actividad de hoy</p>
                    </div>
                    <div className="w-12 h-12 bg-gym-primary/10 rounded-2xl flex items-center justify-center text-gym-primary border border-gym-primary/20">
                        <Users size={20} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] overflow-hidden shadow-sm transition-colors duration-300 mt-6">
                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                        {trainerHistory.map((att) => (
                            <div key={att.id} className="p-8 flex items-center justify-between hover:bg-gray-50/5 dark:hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-sm border-2",
                                        att.status === 'PRESENT'
                                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20"
                                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                                    )}>
                                        {att.trainer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-base uppercase tracking-tight group-hover:text-gym-primary transition-colors">{att.trainer.name}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold tracking-widest uppercase mt-1 italic">
                                            {att.schedule ? `${att.schedule.gymClass.name} (${att.schedule.startTime})` : 'Entrada General'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-white/10 group-hover:border-gym-primary/20 transition-all shadow-sm">
                                        <Clock size={14} className="text-slate-300 dark:text-gray-600" />
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-400 leading-none">
                                            {format(new Date(att.checkIn), 'HH:mm')}
                                            {att.checkOut && ` - ${format(new Date(att.checkOut), 'HH:mm')}`}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg border",
                                        att.status === 'PRESENT'
                                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20"
                                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                                    )}>
                                        {att.status === 'PRESENT' ? 'Puntual' : 'Tardanza'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {trainerHistory.length === 0 && (
                            <div className="py-20 text-center text-gray-200 dark:text-gray-800 flex flex-col items-center gap-4">
                                <Users size={48} strokeWidth={1} className="opacity-50" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Sin actividad de entrenadores hoy</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceTracking;
