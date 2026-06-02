import React, { useEffect, useState } from 'react';
import { X, Search, Send, MessageCircle, Eye, User, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Member {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    memberships: {
        id: number;
        startDate: string;
        endDate: string;
        plan: { name: string };
        payments?: { method: string }[];
    }[];
}

interface WhatsAppSendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TemplateKey = 'active' | 'por_vencer' | 'vencido' | 'grupo';

const TEMPLATE_OPTIONS: { key: TemplateKey; label: string; color: string; bgColor: string; borderColor: string; emoji: string }[] = [
    {
        key: 'active',
        label: 'Socio Activo',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-500/10',
        borderColor: 'border-green-200 dark:border-green-500/30',
        emoji: '🟢',
    },
    {
        key: 'por_vencer',
        label: 'Por Vencer',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-500/10',
        borderColor: 'border-orange-200 dark:border-orange-500/30',
        emoji: '🟡',
    },
    {
        key: 'vencido',
        label: 'Vencido',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-500/10',
        borderColor: 'border-red-200 dark:border-red-500/30',
        emoji: '🔴',
    },
    {
        key: 'grupo',
        label: 'Grupo',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-500/10',
        borderColor: 'border-blue-200 dark:border-blue-500/30',
        emoji: '📢',
    },
];

const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
    active: "Hola *{{nombre}} {{apellido}}*, te deseamos un excelente entrenamiento en tu plan *{{plan}}*. 💪\n\n*Resumen:*\n• Plan: {{plan}}\n• Vencimiento: {{vencimiento}}\n• Estado: {{estado}}\n• Pago: {{pago}}\n\n¡Te esperamos pronto! 🏋️‍♂️🔥",
    por_vencer: "Hola *{{nombre}} {{apellido}}*, te recordamos que tu membresía *{{plan}}* está por vencer el día *{{vencimiento}}*. ⏳\n\n*Resumen:*\n• Plan: {{plan}}\n• Vencimiento: {{vencimiento}}\n• Estado: {{estado}}\n• Pago: {{pago}}\n\n¡Te esperamos pronto! 🏋️‍♂️🔥",
    vencido: "Hola *{{nombre}} {{apellido}}*, te recordamos que tu membresía *{{plan}}* venció el día *{{vencimiento}}*. 🗓️\n\n*Resumen:*\n• Plan: {{plan}}\n• Vencimiento: {{vencimiento}}\n• Estado: {{estado}}\n• Pago: {{pago}}\n\n¡Te esperamos pronto! 🏋️‍♂️🔥",
    grupo: "¡Hola a todos! Recuerden que...\n\n¡Los esperamos para entrenar con todo! 💪🔥",
};

const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('active');
    const [settings, setSettings] = useState<any>({});
    const [showDropdown, setShowDropdown] = useState(false);
    const [sent, setSent] = useState(false);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/members?search=${searchQuery}`);
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
            setSelectedMember(null);
            setSearchQuery('');
            setSelectedTemplate('active');
            setSent(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.length > 1) {
            fetchMembers();
            setShowDropdown(true);
        } else {
            setMembers([]);
            setShowDropdown(false);
        }
    }, [searchQuery]);

    const getTemplate = (key: TemplateKey): string => {
        if (key === 'grupo') return settings.whatsapp_template_grupo || DEFAULT_TEMPLATES[key];
        const settingsKey = `whatsapp_template_${key === 'por_vencer' ? 'por_vencer' : key}`;
        return settings[settingsKey] || DEFAULT_TEMPLATES[key];
    };

    const getStatusLabel = (key: TemplateKey): string => {
        if (key === 'active') return 'ACTIVO';
        if (key === 'por_vencer') return 'POR VENCER';
        return 'VENCIDO';
    };

    const buildMessage = (member: Member | null, templateKey: TemplateKey): string => {
        const template = getTemplate(templateKey);

        if (templateKey === 'grupo') {
            return template;
        }

        if (!member) return template;

        const latestMembership = member.memberships?.[0];
        const endDateStr = latestMembership
            ? format(new Date(latestMembership.endDate), "dd 'de' MMMM", { locale: es })
            : '----';
        const paymentMethod = latestMembership?.payments?.[0]?.method || 'No registrado';

        return template
            .replace(/{{nombre}}/g, member.firstName)
            .replace(/{{apellido}}/g, member.lastName)
            .replace(/{{plan}}/g, latestMembership?.plan?.name || 'Sin plan')
            .replace(/{{vencimiento}}/g, endDateStr)
            .replace(/{{estado}}/g, getStatusLabel(templateKey))
            .replace(/{{pago}}/g, paymentMethod);
    };

    const handleSend = () => {
        if (selectedTemplate === 'grupo') {
            if (!settings.whatsapp_group_link) {
                alert('No has configurado un Link de Grupo en Ajustes.');
                return;
            }
            const message = buildMessage(null, 'grupo');
            navigator.clipboard.writeText(message).then(() => {
                alert('¡Texto copiado al portapapeles! Se abrirá el enlace de tu grupo, donde podrás pegar el mensaje.');
                window.open(settings.whatsapp_group_link, '_blank');
                setSent(true);
                setTimeout(() => setSent(false), 3000);
            }).catch(err => {
                console.error('Error copying to clipboard:', err);
                alert('No se pudo copiar el texto, inténtalo de nuevo.');
            });
            return;
        }

        if (!selectedMember) return;
        if (!selectedMember.phone) {
            alert('Este miembro no tiene un teléfono registrado.');
            return;
        }
        const cleanPhone = selectedMember.phone.replace(/\D/g, '');
        const message = buildMessage(selectedMember, selectedTemplate);
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
        setSent(true);
        setTimeout(() => setSent(false), 3000);
    };

    if (!isOpen) return null;

    const previewMessage = (selectedTemplate === 'grupo' || selectedMember) ? buildMessage(selectedMember, selectedTemplate) : null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[3rem] w-full max-w-2xl shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 transition-colors flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 transition-colors shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-100 dark:border-green-500/20">
                            <MessageCircle className="text-green-500" size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Enviar WhatsApp</h2>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">Selecciona miembro y plantilla</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">

                    {/* Template Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                            1. ELEGIR PLANTILLA / TIPO DE MENSAJE
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {TEMPLATE_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setSelectedTemplate(opt.key)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 text-left transition-all",
                                        selectedTemplate === opt.key
                                            ? `${opt.bgColor} ${opt.borderColor} shadow-md`
                                            : "bg-gray-50 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                    )}
                                >
                                    <span className="text-xl block mb-2">{opt.emoji}</span>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest block",
                                        selectedTemplate === opt.key ? opt.color : "text-gray-400 dark:text-gray-500"
                                    )}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Member Search (Only if individual) */}
                    {selectedTemplate !== 'grupo' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                                2. SELECCIONAR MIEMBRO
                            </label>
                            {selectedMember ? (
                                <div className="flex items-center justify-between bg-green-50 dark:bg-green-500/10 border-2 border-green-200 dark:border-green-500/30 p-4 rounded-[1.5rem] animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-500/20">
                                            {selectedMember.firstName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                                {selectedMember.firstName} {selectedMember.lastName}
                                            </p>
                                            <p className="text-[10px] text-green-600 dark:text-green-400 font-black tracking-[0.2em] mt-1 uppercase">
                                                DNI {selectedMember.dni} • 📱 {selectedMember.phone || 'Sin teléfono'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedMember(null); setSearchQuery(''); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar por nombre o DNI..."
                                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl py-4 pl-14 pr-5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                            autoFocus
                                        />
                                    </div>
                                    {showDropdown && members.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-[1.5rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                                {members.map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => { setSelectedMember(m); setShowDropdown(false); setSearchQuery(''); }}
                                                        className="w-full text-left px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50 dark:border-white/5 last:border-0 transition-all flex items-center gap-4 group"
                                                    >
                                                        <div className="w-9 h-9 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center font-black text-slate-900 dark:text-white text-sm group-hover:bg-gym-primary group-hover:text-white transition-all">
                                                            {m.firstName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <span className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-tight group-hover:text-gym-primary transition-colors block">
                                                                {m.firstName} {m.lastName}
                                                            </span>
                                                            <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 tracking-widest">
                                                                DNI: {m.dni} • {m.phone || 'Sin teléfono'}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {showDropdown && members.length === 0 && searchQuery.length > 1 && (
                                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl p-6 text-center z-50">
                                            <User size={24} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                                            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Sin resultados</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message Preview */}
                    {previewMessage && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Eye size={12} />
                                VISTA PREVIA DEL MENSAJE
                            </label>
                            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5">
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                                    <pre className="text-xs text-slate-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                        {previewMessage}
                                    </pre>
                                </div>
                                <p className="text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-3 text-right">
                                    {selectedTemplate === 'grupo' ? '📢 Se abrirá el grupo configurado' : `📱 Se enviará a: ${selectedMember?.phone || 'Sin teléfono'}`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 transition-colors flex justify-between items-center shrink-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={(selectedTemplate !== 'grupo' && (!selectedMember || !selectedMember.phone)) || (selectedTemplate === 'grupo' && !settings.whatsapp_group_link)}
                        className={cn(
                            "flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl min-w-[200px] justify-center",
                            sent
                                ? "bg-green-500 text-white shadow-green-500/20"
                                : "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                        )}
                    >
                        {sent ? (
                            <>
                                <CheckCircle2 size={18} strokeWidth={3} />
                                <span>¡Enviado!</span>
                            </>
                        ) : (
                            <>
                                <Send size={18} strokeWidth={3} />
                                <span>Abrir WhatsApp</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSendModal;
