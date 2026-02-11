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
    }, []);

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
                        method: 'BIOMETRIC'
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
                method: 'MANUAL'
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
            <div className="fixed inset-0 z-[100] bg-gym-dark flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                <button
                    onClick={() => setIsKioskMode(false)}
                    className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors flex items-center gap-2"
                >
                    <XCircle size={24} />
                    <span>Salir Modo Quiosco</span>
                </button>

                <div className="w-full max-w-4xl space-y-12 text-center">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                            Control de Acceso <span className="text-gym-primary">eiGYM</span>
                        </h1>
                        <p className="text-2xl text-gray-400">Por favor, coloque su huella en el sensor</p>
                    </div>

                    <div className={cn(
                        "aspect-square w-64 h-64 mx-auto rounded-[60px] flex items-center justify-center transition-all duration-500 border-8",
                        lastRes?.allowed ? "bg-green-500 border-green-400 shadow-[0_0_80px_rgba(34,197,94,0.4)]" :
                            lastRes?.allowed === false ? "bg-red-500 border-red-400 shadow-[0_0_80px_rgba(239,68,68,0.4)]" :
                                isScanning ? "bg-gym-primary/20 border-gym-primary animate-pulse" : "bg-white/5 border-white/10"
                    )}>
                        {lastRes?.allowed ? <CheckCircle2 size={120} className="text-white" /> :
                            lastRes?.allowed === false ? <XCircle size={120} className="text-white" /> :
                                <Fingerprint size={120} className={cn(isScanning ? "text-gym-primary" : "text-white/20")} />}
                    </div>

                    <div className="min-h-[200px] flex flex-col items-center justify-center">
                        {lastRes ? (
                            <div className="animate-in zoom-in duration-300">
                                <h2 className={cn(
                                    "text-6xl font-black uppercase mb-4",
                                    lastRes.allowed ? "text-green-500" : "text-red-500"
                                )}>
                                    {lastRes.allowed ? '¡ACCESO CONCEDIDO!' : 'ACCESO DENEGADO'}
                                </h2>
                                <p className="text-4xl font-bold text-white">{lastRes.member.name}</p>
                                <p className="text-xl text-gray-400 mt-4">{lastRes.message}</p>
                            </div>
                        ) : error ? (
                            <div className="animate-in shake duration-300">
                                <p className="text-2xl text-red-500 font-bold bg-red-500/10 px-8 py-4 rounded-2xl border border-red-500/20">
                                    {error}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 bg-gym-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-3 h-3 bg-gym-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-3 h-3 bg-gym-primary rounded-full animate-bounce" />
                                </div>
                                <p className="text-xl text-gray-500 font-medium">ESPERANDO HUELLA...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-between items-end">
                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                        <div className="p-3 bg-gym-primary/20 rounded-2xl">
                            <Clock className="text-gym-primary" size={32} />
                        </div>
                        <div className="text-left">
                            <p className="text-3xl font-bold text-white leading-none">
                                {format(new Date(), 'HH:mm')}
                            </p>
                            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">
                                {format(new Date(), 'EEEE, d MMMM')}
                            </p>
                        </div>
                    </div>

                    <div className="text-right opacity-30">
                        <p className="text-xs font-mono">eiGYM SYSTEM v1.0.2</p>
                        <p className="text-xs font-mono uppercase">Secure Biometric Kiosk Mode</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* Check-in Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Control de Asistencia</h1>
                        <p className="text-gray-400 mt-1">Ingresa el DNI o usa biometría</p>
                    </div>
                    <button
                        onClick={() => setIsKioskMode(true)}
                        className="bg-gym-primary/10 hover:bg-gym-primary/20 text-gym-primary px-4 py-2 rounded-xl transition-colors flex items-center gap-2 font-bold"
                    >
                        <ScanLine size={20} />
                        Modo Quiosco
                    </button>
                </div>

                <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                    {/* Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gym-primary rounded-full blur-[80px] opacity-10" />

                    <form onSubmit={handleCheckIn} className="relative z-10 space-y-6">
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className={cn(
                                "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500",
                                lastRes?.allowed ? "bg-green-500 shadow-lg shadow-green-500/20" :
                                    lastRes?.allowed === false ? "bg-red-500 shadow-lg shadow-red-500/20" :
                                        "bg-gym-primary/20 text-gym-primary"
                            )}>
                                {lastRes?.allowed ? <CheckCircle2 size={48} className="text-white" /> :
                                    lastRes?.allowed === false ? <XCircle size={48} className="text-white" /> :
                                        <ScanLine size={48} className={cn(isScanning && "animate-pulse")} />}
                            </div>
                            <h2 className="text-xl font-bold">Registro Manual / QR</h2>
                        </div>

                        <div className="relative group flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gym-primary transition-colors" size={24} />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Ingresa DNI o nombre del miembro..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all font-sans"
                                    autoFocus
                                />

                                {showSuggestions && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-gym-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {suggestions.map((member) => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => handleSelectMember(member)}
                                                    className="w-full text-left px-6 py-4 hover:bg-white/5 border-b border-white/5 transition-colors flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="font-bold text-white uppercase group-hover:text-gym-primary transition-colors">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-mono">{member.dni}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                                                        member.status === 'ACTIVE' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
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
                                    "p-4 rounded-2xl transition-colors flex flex-col items-center justify-center min-w-[100px]",
                                    isScanning ? "bg-gym-primary/50 text-white cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white"
                                )}
                                title="Escanear Huella"
                            >
                                <Fingerprint size={32} className={cn(isScanning && "animate-pulse")} />
                                <span className="text-xs mt-1">{isScanning ? 'Escaneando' : 'Huella'}</span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gym-primary hover:bg-gym-primary/90 text-white font-bold py-5 rounded-2xl shadow-lg shadow-gym-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-xl"
                        >
                            {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar Ingreso'}
                        </button>

                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
                                <AlertCircle size={20} />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Result Message Container (Hidden if no result to keep layout tidy) */}
                <div className="min-h-[140px]">
                    {lastRes && (
                        <div className={cn(
                            "p-6 rounded-3xl border animate-in slide-in-from-top-4 duration-300",
                            lastRes.allowed ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                            <h3 className="text-2xl font-bold mb-1">{lastRes.allowed ? '¡ACCESO CONCEDIDO!' : 'ACCESO DENEGADO'}</h3>
                            <p className="text-lg opacity-90">{lastRes.member.name}</p>
                            <p className="mt-2 text-sm">{lastRes.message}</p>
                        </div>
                    )}
                </div>
            </div >

            {/* Recent History Section */}
            < div className="space-y-6" >
                <div>
                    <h2 className="text-2xl font-bold">Hoy</h2>
                    <p className="text-gray-400 mt-1">Últimos ingresos registrados</p>
                </div>

                <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
                    <div className="divide-y divide-white/5">
                        {recentAttendances.map((att) => (
                            <div key={att.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                                        att.accessAllowed ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                    )}>
                                        {att.member.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{att.member.firstName} {att.member.lastName}</p>
                                        <p className="text-xs text-gray-400 font-mono">{att.member.dni}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                        <Clock size={14} />
                                        {format(new Date(att.date), 'HH:mm:ss')}
                                    </div>
                                    <div className={cn(
                                        "text-[10px] font-bold uppercase mt-1",
                                        att.accessAllowed ? "text-green-500" : "text-red-500"
                                    )}>
                                        {att.accessAllowed ? 'Autorizado' : 'Denegado'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentAttendances.length === 0 && (
                            <div className="py-20 text-center text-gray-500 italic">
                                No hay asistencias hoy
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default AttendanceTracking;
