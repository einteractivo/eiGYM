import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { read, utils } from 'xlsx';
import {
    Search,
    User,
    Edit,
    Trash2,
    MessageCircle,
    Filter,
    Send,
    Upload,
    AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import MemberModal from '../components/MemberModal';
import WhatsAppSendModal from '../components/WhatsAppSendModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Member {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    email: string;
    status: 'ACTIVE' | 'INACTIVE';
    notes?: string;
    memberships: {
        id: number;
        startDate: string;
        endDate: string;
        plan: {
            name: string;
        };
        payments?: {
            method: string;
        }[];
    }[];
}

const MemberManagement: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
    const [settings, setSettings] = useState<any>({});
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
    
    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showChurnRiskOnly, setShowChurnRiskOnly] = useState(false);
    const [churnRiskMembers, setChurnRiskMembers] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchSettings = async () => {
        try {
            const [settingsRes, plansRes] = await Promise.all([
                api.get('/settings'),
                api.get('/plans')
            ]);
            setSettings(settingsRes.data);
            setPlans(plansRes.data);
        } catch (error) {
            console.error('Error fetching settings or plans:', error);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/members?search=${search}`);
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChurnRiskMembers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/members/churn-risk');
            setChurnRiskMembers(response.data);
        } catch (error) {
            console.error('Error fetching churn risk members:', error);
        } finally {
            setLoading(false);
        }
    };

    const location = useLocation();

    useEffect(() => {
        if (location.state?.openModal) {
            handleOpenModal();
        }
        fetchSettings();
    }, [location.state]);

    useEffect(() => {
        if (showChurnRiskOnly) {
            fetchChurnRiskMembers();
        } else {
            const timer = setTimeout(() => {
                fetchMembers();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [search, showChurnRiskOnly]);

    const handleOpenModal = (member?: Member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMember(undefined);
    };

    const handleSuccess = () => {
        if (showChurnRiskOnly) {
            fetchChurnRiskMembers();
        } else {
            fetchMembers();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setIsImportModalOpen(false); // Close the tutorial modal
        const toastId = toast.loading('Leyendo archivo...');

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json<any>(firstSheet);

            if (jsonData.length === 0) {
                toast.error('El archivo está vacío', { id: toastId });
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            toast.loading(`Procesando ${jsonData.length} registros...`, { id: toastId });

            const mappedMembers = jsonData.map((row: any) => {
                // Try to guess columns regardless of exact case
                const keys = Object.keys(row);
                const findVal = (possibleNames: string[]) => {
                    const key = keys.find(k => possibleNames.some(n => k.toLowerCase().includes(n)));
                    return key ? row[key] : undefined;
                };

                return {
                    firstName: findVal(['nombre', 'first']),
                    lastName: findVal(['apellido', 'last']),
                    dni: findVal(['dni', 'documento', 'rut', 'cedula']),
                    email: findVal(['correo', 'email']),
                    phone: findVal(['telefono', 'celular', 'phone']),
                    birthday: findVal(['cumpleaños', 'birthday', 'fecha_nacimiento', 'fecha de nacimiento'])
                };
            }).filter((m: any) => m.dni); // Only those with DNI

            if (mappedMembers.length === 0) {
                toast.error('No se encontraron registros con DNI', { id: toastId });
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            const res = await api.post('/members/import', { members: mappedMembers });
            toast.success(`${res.data.message} (${res.data.count} agregados/actualizados)`, { id: toastId });
            handleSuccess();
        } catch (error: any) {
            console.error('Error importing:', error);
            toast.error(error.response?.data?.message || 'Error al importar archivo', { id: toastId });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este miembro? Esta acción no se puede deshacer.')) {
            try {
                await api.delete(`/members/${id}`);
                setMembers(prev => prev.filter(m => m.id !== id));
                setChurnRiskMembers(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                console.error('Error deleting member:', error);
                alert('No se pudo eliminar el miembro. Por favor, inténtalo de nuevo.');
            }
        }
    };

    const getStatusInfo = (member: Member) => {
        const latestMembership = member.memberships[0];
        if (!latestMembership) return { label: 'SIN PLAN', color: 'bg-gray-100 text-gray-500' };

        const today = new Date();
        const endDate = new Date(latestMembership.endDate);

        const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endReset = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        const diffTime = endReset.getTime() - todayReset.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: 'VENCIDO', color: 'bg-red-50 text-red-600' };
        } else if (diffDays <= 3) {
            return { label: 'POR VENCER', color: 'bg-orange-50 text-orange-600 font-bold' };
        } else {
            return { label: 'ACTIVO', color: 'bg-green-50 text-green-600 font-bold' };
        }
    };

    const handleWhatsApp = (member: any) => {
        if (!member.phone) {
            alert('Este miembro no tiene un teléfono registrado');
            return;
        }

        const isChurnRiskObject = !member.memberships && member.riskLevel;
        
        let latestMembership = null;
        let statusLabel = '';
        let planName = 'Sin plan';
        let endDateStr = '----';
        let paymentMethod = 'No registrado';

        if (isChurnRiskObject) {
            statusLabel = member.daysToExpiration < 0 ? 'VENCIDO' : (member.daysToExpiration <= 3 ? 'POR VENCER' : 'ACTIVO');
            planName = member.planName || 'Plan General';
            if (member.membershipEndDate) {
                endDateStr = format(new Date(member.membershipEndDate), "dd 'de' MMMM", { locale: es });
            }
        } else {
            latestMembership = member.memberships?.[0];
            const statusInfo = getStatusInfo(member);
            statusLabel = statusInfo.label;
            planName = latestMembership?.plan?.name || 'Sin plan';
            if (latestMembership) {
                endDateStr = format(new Date(latestMembership.endDate), "dd 'de' MMMM", { locale: es });
            }
            paymentMethod = (latestMembership?.payments && latestMembership.payments[0]) ? latestMembership.payments[0].method : 'No registrado';
        }

        const cleanPhone = member.phone.replace(/\D/g, '');
        const promoText = "¡Tenemos una promoción especial para que sigas entrenando con nosotros! Pregunta por nuestros descuentos de temporada. 🎁";

        let template = '';
        if (isChurnRiskObject) {
            if (member.daysSinceLastAttendance && member.daysSinceLastAttendance > 14) {
                template = "Hola *{{nombre}} {{apellido}}*, ¡te extrañamos en el gimnasio! 💪\nHace *{{diasAsistencia}} días* que no te vemos entrenar. ¿Todo bien por ahí?\n\nRecuerda que la constancia es la clave para ver resultados. Queremos motivarte a volver:\n{{promo}}\n\n¡Te esperamos de vuelta pronto! 🏋️‍♂️🔥";
            } else {
                template = "Hola *{{nombre}} {{apellido}}*, esperamos que estés muy bien. 💪\nQueremos recordarte que tu membresía vence pronto (el *{{vencimiento}}*).\n\n{{promo}}\n\n¡Esperamos seguir entrenando juntos! 🏋️‍♂️🔥";
            }
        } else {
            if (statusLabel === 'VENCIDO') {
                template = settings.whatsapp_template_vencido ||
                    "Hola *{{nombre}} {{apellido}}*, te recordamos que tu membresía *{{plan}}* venció el día *{{vencimiento}}*. 🗓️\n\n{{promo}}\n\n*Resumen:*\n• Plan: {{plan}}\n• Vencimiento: {{vencimiento}}\n• Estado: {{estado}}\n• Pago: {{pago}}\n\n¡Te esperamos pronto! 🏋️‍♂️🔥";
            } else if (statusLabel === 'POR VENCER') {
                template = settings.whatsapp_template_por_vencer ||
                    "Hola *{{nombre}} {{apellido}}*, te recordamos que tu membresía *{{plan}}* está por vencer el día *{{vencimiento}}*. ⏳\n\n{{promo}}\n\n*Resumen:*\n• Plan: {{plan}}\n• Vencimiento: {{vencimiento}}\n• Estado: {{estado}}\n• Pago: {{pago}}\n\n¡Te esperamos pronto! 🏋️‍♂️🔥";
            } else {
                template = settings.whatsapp_template_active ||
                    "Hola *{{nombre}} {{apellido}}*, te deseamos un excelente entrenamiento en tu plan *{{plan}}*. 💪\n\n{{promo}}\n\n*Resumen:*\n• Plan: {{plan}}\n• Vencimiento: {{vencimiento}}\n• Estado: {{estado}}\n• Pago: {{pago}}\n\n¡Te esperamos pronto! 🏋️‍♂️🔥";
            }
        }

        const message = template
            .replace(/{{nombre}}/g, member.firstName)
            .replace(/{{apellido}}/g, member.lastName)
            .replace(/{{plan}}/g, planName)
            .replace(/{{vencimiento}}/g, endDateStr)
            .replace(/{{estado}}/g, statusLabel)
            .replace(/{{pago}}/g, paymentMethod)
            .replace(/{{promo}}/g, promoText)
            .replace(/{{diasAsistencia}}/g, String(member.daysSinceLastAttendance || 0));

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    };

    const filteredMembers = members.filter(member => {
        // Plan filter
        const latestMembership = member.memberships[0];
        const planName = latestMembership?.plan?.name || 'sin_plan';
        
        let planMatch = true;
        if (selectedPlanFilter !== 'all') {
            if (selectedPlanFilter === 'sin_plan') {
                planMatch = planName === 'sin_plan';
            } else {
                planMatch = planName === selectedPlanFilter;
            }
        }

        // Status filter
        let statusMatch = true;
        if (selectedStatusFilter !== 'all') {
            const statusInfo = getStatusInfo(member);
            statusMatch = statusInfo.label === selectedStatusFilter;
        }

        return planMatch && statusMatch;
    });

    const filteredChurnMembers = churnRiskMembers.filter(m => 
        m.firstName.toLowerCase().includes(search.toLowerCase()) ||
        m.lastName.toLowerCase().includes(search.toLowerCase()) ||
        m.dni.includes(search)
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 transition-colors duration-300">
            {/* Header / Top Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full sm:w-auto bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 font-black px-8 py-4 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-none uppercase tracking-widest text-xs"
                    >
                        <User size={18} strokeWidth={3} />
                        <span>Nuevo Socio</span>
                    </button>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        disabled={isImporting}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 font-black px-6 py-4 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all shadow-sm uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        <Upload size={18} strokeWidth={3} />
                        <span>{isImporting ? 'Importando...' : 'Importar CSV/Excel'}</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                        className="hidden" 
                    />

                    <button
                        onClick={() => setIsWhatsAppModalOpen(true)}
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-black px-8 py-4 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/20 uppercase tracking-widest text-xs"
                    >
                        <Send size={18} strokeWidth={3} />
                        <span>Enviar WhatsApp</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowChurnRiskOnly(!showChurnRiskOnly);
                            setShowFilters(false);
                            setSelectedPlanFilter('all');
                            setSelectedStatusFilter('all');
                        }}
                        className={cn(
                            "w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] transition-all font-black text-xs uppercase tracking-widest border",
                            showChurnRiskOnly
                                ? "bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-xl shadow-red-500/20"
                                : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 hover:dark:bg-red-500/20"
                        )}
                    >
                        <User size={18} strokeWidth={3} className={showChurnRiskOnly ? "text-white" : "text-red-500"} />
                        <span>Socios en Riesgo</span>
                    </button>

                    {!showChurnRiskOnly && (
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "hidden sm:flex items-center gap-3 px-5 py-3 border rounded-[1.25rem] transition-all",
                                showFilters || selectedPlanFilter !== 'all' || selectedStatusFilter !== 'all'
                                    ? "bg-gym-primary/10 border-gym-primary/20 text-gym-primary" 
                                    : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-slate-400 dark:text-gray-500 hover:bg-gray-100 hover:dark:bg-white/10"
                            )}
                        >
                            <Filter size={16} className={showFilters || selectedPlanFilter !== 'all' || selectedStatusFilter !== 'all' ? "text-gym-primary" : "text-slate-400 dark:text-gray-500"} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {selectedPlanFilter !== 'all' || selectedStatusFilter !== 'all' ? 'Filtros Aplicados' : 'Filtros'}
                            </span>
                        </button>
                    )}
                </div>

                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o DNI..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-8 focus:ring-gym-primary/5 transition-all font-bold text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* Filters Bar */}
            {showFilters && !showChurnRiskOnly && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300 animate-in fade-in slide-in-from-top-4">
                    <div className="w-full sm:w-auto flex-1">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">Filtrar por Estado</label>
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-gym-primary/30 rounded-[1.25rem] px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer transition-all appearance-none"
                        >
                            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos los estados</option>
                            <option value="ACTIVO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Activos</option>
                            <option value="POR VENCER" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Por Vencer</option>
                            <option value="VENCIDO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Vencidos</option>
                            <option value="SIN PLAN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sin Plan</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-auto flex-1">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 px-1">Filtrar por Plan</label>
                        <select
                            value={selectedPlanFilter}
                            onChange={(e) => setSelectedPlanFilter(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-gym-primary/30 rounded-[1.25rem] px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer transition-all appearance-none"
                        >
                            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos los planes</option>
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{plan.name}</option>
                            ))}
                            <option value="sin_plan" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sin Plan</option>
                        </select>
                    </div>
                    {(selectedPlanFilter !== 'all' || selectedStatusFilter !== 'all') && (
                        <div className="w-full sm:w-auto flex items-end ml-auto">
                            <button
                                onClick={() => {
                                    setSelectedPlanFilter('all');
                                    setSelectedStatusFilter('all');
                                }}
                                className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50/50 hover:bg-red-50 px-4 py-3 rounded-[1.25rem] transition-colors h-[48px] flex items-center justify-center mt-6 sm:mt-0 shadow-sm border border-red-500/10"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Members Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/[0.02] text-slate-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50 dark:border-white/5">
                                <th className="py-6 px-8 text-center w-24 tracking-[0.3em]">ID</th>
                                <th className="py-6 px-8">INFORMACIÓN DEL SOCIO</th>
                                {showChurnRiskOnly ? (
                                    <>
                                        <th className="py-6 px-8">MOTIVO DE RIESGO DE ABANDONO</th>
                                        <th className="py-6 px-8 text-center">ÚLTIMA ASISTENCIA</th>
                                        <th className="py-6 px-8 text-center">NIVEL DE RIESGO</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="py-6 px-8 text-center">PLAN ACTUAL</th>
                                        <th className="py-6 px-8 text-center">VENCIMIENTO</th>
                                        <th className="py-6 px-8 text-center">ESTADO</th>
                                    </>
                                )}
                                <th className="py-6 px-8 text-right pr-12">GESTIÓN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-slate-900 dark:text-white">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="py-10 px-8">
                                            <div className="h-12 bg-gray-50 dark:bg-white/5 rounded-[1.25rem] w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : showChurnRiskOnly ? (
                                filteredChurnMembers.length > 0 ? (
                                    filteredChurnMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-red-50/10 dark:hover:bg-red-950/10 transition-all group border-l-4 border-red-500">
                                            <td className="py-6 px-8 text-center">
                                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-red-500 mx-auto border border-red-100 dark:border-red-500/20 shadow-sm transition-all duration-300">
                                                    <User size={20} strokeWidth={2.5} />
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-tight group-hover:text-red-500 transition-colors">{member.firstName} {member.lastName}</p>
                                                        <span className="text-[9px] font-black text-gray-300 dark:text-gray-700 tracking-widest">#{member.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10">DNI: {member.dni}</span>
                                                        {member.phone && (
                                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 flex items-center gap-1">
                                                                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                                {member.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">
                                                    {member.riskReason}
                                                </p>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight italic">
                                                        {member.lastAttendanceDate
                                                            ? format(new Date(member.lastAttendanceDate), "dd MMM yyyy", { locale: es })
                                                            : 'Nunca'
                                                        }
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mt-0.5">
                                                        {member.daysSinceLastAttendance !== null 
                                                            ? `Hace ${member.daysSinceLastAttendance} días`
                                                            : 'Sin registro'
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                                    member.riskLevel === 'HIGH' 
                                                        ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                                        : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                                                )}>
                                                    {member.riskLevel === 'HIGH' ? 'RIESGO ALTO' : 'RIESGO MEDIO'} ({member.riskScore}%)
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right pr-12">
                                                <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                    <button
                                                        onClick={() => handleWhatsApp(member)}
                                                        className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100 shadow-sm"
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(member)}
                                                        className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 shadow-sm"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100 shadow-sm"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 text-gray-200 dark:text-gray-800">
                                                <User size={64} strokeWidth={1} />
                                                <p className="text-xs font-black uppercase tracking-[0.3em] italic">No hay socios en riesgo identificados</p>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ) : filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => {
                                    const latestMembership = member.memberships[0];
                                    return (
                                        <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group">
                                            <td className="py-6 px-8 text-center">
                                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-gray-600 mx-auto border border-gray-100 dark:border-white/10 shadow-sm group-hover:scale-110 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-300">
                                                    <User size={20} strokeWidth={2.5} />
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-tight group-hover:text-gym-primary transition-colors">{member.firstName} {member.lastName}</p>
                                                        <span className="text-[9px] font-black text-gray-300 dark:text-gray-700 tracking-widest">#{member.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10">DNI: {member.dni}</span>
                                                        {member.phone && (
                                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 flex items-center gap-1">
                                                                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                                {member.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                    {latestMembership?.plan.name || '---'}
                                                </p>
                                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                    {latestMembership?.payments?.[0]?.method || 'S/G'}
                                                </p>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight italic">
                                                        {latestMembership
                                                            ? format(new Date(latestMembership.endDate), "dd MMM yyyy", { locale: es })
                                                            : '----'
                                                        }
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mt-0.5">Vencimiento</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                {(() => {
                                                    const status = getStatusInfo(member);
                                                    return (
                                                        <span className={cn(
                                                            "inline-flex items-center px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                                            status.color.includes('red') ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400' :
                                                                status.color.includes('orange') ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400' :
                                                                    status.color.includes('green') ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 dark:text-gray-600',
                                                        )}>
                                                            {status.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-6 px-8 text-right pr-12">
                                                <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                    <button
                                                        onClick={() => handleWhatsApp(member)}
                                                        className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100 shadow-sm"
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(member)}
                                                        className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 shadow-sm"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100 shadow-sm"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-200 dark:text-gray-800">
                                            <User size={64} strokeWidth={1} />
                                            <p className="text-xs font-black uppercase tracking-[0.3em] italic">No se encontraron socios registrados</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <MemberModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                member={selectedMember}
            />

            {/* Modal de Tutorial de Importación */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsImportModalOpen(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100 dark:border-white/10">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-gym-primary/10 rounded-2xl flex items-center justify-center">
                                    <Upload className="text-gym-primary" size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Importar Socios</h2>
                                    <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Tutorial para Excel/CSV</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
                                <p>Para importar tus socios correctamente, asegúrate de que tu archivo de Excel (.xlsx, .xls) o CSV tenga al menos la columna <strong>DNI</strong>. El sistema es inteligente y detectará las siguientes columnas automáticamente (sin importar mayúsculas):</p>
                                
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-white/5 space-y-3">
                                    <div className="flex gap-2">
                                        <span className="font-bold w-24">Nombre:</span>
                                        <span className="text-slate-500">"nombre", "first"</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold w-24">Apellido:</span>
                                        <span className="text-slate-500">"apellido", "last"</span>
                                    </div>
                                    <div className="flex gap-2 text-gym-primary">
                                        <span className="font-bold w-24">DNI:</span>
                                        <span className="text-gym-primary/70">"dni", "documento", "rut", "cedula" (Requerido)</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold w-24">Email:</span>
                                        <span className="text-slate-500">"correo", "email"</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold w-24">Teléfono:</span>
                                        <span className="text-slate-500">"telefono", "celular", "phone"</span>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-xl flex gap-3 text-xs font-medium">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <p>Nota: Los socios sin un documento de identidad (DNI) válido serán ignorados en la importación. Los datos duplicados se actualizarán si el DNI coincide con uno existente.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors uppercase text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-gym-primary hover:bg-gym-primary/90 text-white rounded-xl font-bold transition-colors shadow-lg shadow-gym-primary/20 flex items-center gap-2 uppercase text-xs"
                                >
                                    <Upload size={16} strokeWidth={3} />
                                    Seleccionar Archivo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <WhatsAppSendModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
            />
        </div>
    );
};

export default MemberManagement;
