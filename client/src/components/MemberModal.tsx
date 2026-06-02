import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Camera, Fingerprint, Edit, Calendar, CreditCard, User } from 'lucide-react';
import api, { getUploadUrl } from '../services/api';
import WebcamCapture from './WebcamCapture';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Plan {
    id: number;
    name: string;
    price: string;
    durationDays: number;
}

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    member?: any;
}

const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onSuccess, member }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        phone: '',
        email: '',
        address: '',
        birthday: '',
        fingerprintId: '',
        planId: '',
        paymentMethod: 'CASH',
        notes: ''
    });
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);

    useEffect(() => {
        if (member) {
            setIsEditing(false);
            setFormData({
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                dni: member.dni || '',
                phone: member.phone || '',
                email: member.email || '',
                address: member.address || '',
                birthday: member.birthday ? new Date(member.birthday).toISOString().split('T')[0] : '',
                fingerprintId: member.fingerprintId || '',
                planId: '',
                paymentMethod: 'CASH',
                notes: member.notes || ''
            });
            setPhoto(member.photoUrl || null);
        } else {
            setIsEditing(true);
            setFormData({
                firstName: '',
                lastName: '',
                dni: '',
                phone: '',
                email: '',
                address: '',
                birthday: '',
                fingerprintId: '',
                planId: '',
                paymentMethod: 'CASH',
                notes: ''
            });
            setPhoto(null);
        }
        setError(null);
        setShowWebcam(false);
    }, [member, isOpen]);

    useEffect(() => {
        if (isOpen && (isEditing || !member)) {
            const fetchPlans = async () => {
                try {
                    const response = await api.get('/plans');
                    setPlans(response.data);
                } catch (err) {
                    console.error('Error fetching plans', err);
                }
            };
            fetchPlans();
        }
    }, [isOpen, isEditing, member]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'dni') {
            // Only numbers, max 8 digits for Peruvian DNI
            const numericValue = value.replace(/\D/g, '').slice(0, 8);
            setFormData({ ...formData, [name]: numericValue });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                photoUrl: photo
            };

            if (member) {
                await api.put(`/members/${member.id}`, payload);
            } else {
                await api.post('/members', payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al guardar el miembro');
        } finally {
            setLoading(false);
        }
    };

    // View Mode Component
    if (!isEditing && member) {
        const activeMembership = member.memberships?.[0]; // Assuming sorted by date descending from backend
        const isExpired = activeMembership ? new Date(activeMembership.endDate) < new Date() : true;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] w-full max-w-3xl max-h-[95vh] flex flex-col shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 transition-colors duration-300">
                    <div className="flex justify-between items-center px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Detalles del Socio</h2>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1 italic">Expediente de socio activo</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 sm:p-10 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="flex flex-col md:flex-row gap-10">
                            {/* Left Column: Photo & Status */}
                            <div className="flex flex-col items-center gap-6 md:w-1/3">
                                <div className="w-48 h-48 rounded-[2rem] overflow-hidden border-4 border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-slate-800 shadow-inner flex items-center justify-center text-slate-200 dark:text-slate-700">
                                    {member.photoUrl ? (
                                        <img src={getUploadUrl(member.photoUrl)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={80} strokeWidth={1} />
                                    )}
                                </div>
                                <div className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                    isExpired ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400"
                                )}>
                                    {isExpired ? 'Membresía Vencida' : 'Membresía Activa'}
                                </div>
                            </div>

                            {/* Right Column: Info */}
                            <div className="flex-1 space-y-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{member.firstName} {member.lastName}</h3>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 italic">DNI: {member.dni}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 space-y-1">
                                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">TELÉFONO MÓVIL</div>
                                        <div className="font-extrabold text-slate-900 dark:text-white">{member.phone || 'NO REGISTRADO'}</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 space-y-1">
                                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">CORREO ELECTRÓNICO</div>
                                        <div className="font-extrabold text-slate-900 dark:text-white truncate" title={member.email}>{member.email || 'NO REGISTRADO'}</div>
                                    </div>
                                </div>

                                <div className="bg-gym-primary/5 border-2 border-gym-primary/10 p-8 rounded-[2rem] space-y-4 shadow-sm">
                                    <div className="flex items-center gap-3 text-gym-primary font-black uppercase tracking-widest text-xs mb-2">
                                        <CreditCard size={18} strokeWidth={3} />
                                        <span>Plan de Entrenamiento</span>
                                    </div>
                                    {activeMembership ? (
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-[9px] font-black text-gym-primary/60 uppercase tracking-wider mb-1">MEMBRESÍA</div>
                                                <div className="font-black text-slate-900 dark:text-white text-xl tracking-tight uppercase">
                                                    {activeMembership.plan?.name || '---'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-gym-primary/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <Calendar size={12} /> FECHA DE VENCIMIENTO
                                                </div>
                                                <div className={cn(
                                                    "font-black text-xl tracking-tighter italic",
                                                    isExpired ? 'text-red-500' : 'text-slate-900 dark:text-white'
                                                )}>
                                                    {format(new Date(activeMembership.endDate), "dd MMM yyyy", { locale: es })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-slate-400 italic">No tiene membresía registrada.</p>
                                    )}
                                </div>

                                {member.notes && (
                                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-8 rounded-[2rem] space-y-3">
                                        <div className="flex items-center gap-2 text-slate-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest">
                                            <Edit size={14} />
                                            <span>Observaciones / Notas</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-gray-400 leading-relaxed italic">{member.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 sm:px-10 py-6 sm:py-8 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 hover:text-slate-900 dark:hover:text-white transition-all order-2 sm:order-1"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-10 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-gray-100 transition-all shadow-xl shadow-slate-200 dark:shadow-none uppercase tracking-widest text-xs order-1 sm:order-2"
                        >
                            <Edit size={18} strokeWidth={2.5} />
                            <span>Editar Expediente</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Edit/Create Mode Component
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] w-full max-w-5xl max-h-[95vh] flex flex-col shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 transition-colors duration-300">
                <div className="flex justify-between items-center px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {member ? 'Editar Socio' : 'Registro de Nuevo Socio'}
                        </h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1 italic">Complete todos los datos requeridos</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 sm:p-10 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
                            {/* Photo Section */}
                            <div className="lg:col-span-1 flex flex-col items-center gap-6">
                                <div className="w-full aspect-square bg-gray-50 dark:bg-slate-800 rounded-[2.5rem] border-4 border-dashed border-gray-100 dark:border-white/10 flex items-center justify-center overflow-hidden relative group shadow-inner">
                                    {showWebcam ? (
                                        <WebcamCapture onCapture={(src) => {
                                            setPhoto(src);
                                            setShowWebcam(false);
                                        }} />
                                    ) : photo ? (
                                        <>
                                            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowWebcam(true)}
                                                    className="w-12 h-12 bg-white text-slate-900 rounded-2xl hover:scale-110 transition-all flex items-center justify-center shadow-lg"
                                                >
                                                    <Camera size={24} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPhoto(null)}
                                                    className="w-12 h-12 bg-red-500 text-white rounded-2xl hover:scale-110 transition-all flex items-center justify-center shadow-lg"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowWebcam(true)}
                                            className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-700 hover:text-gym-primary transition-all group/cam"
                                        >
                                            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/10 flex items-center justify-center group-hover/cam:scale-110 transition-transform shadow-sm">
                                                <Camera size={40} strokeWidth={1} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Toma una Foto</span>
                                        </button>
                                    )}
                                </div>
                                <div className="text-center space-y-2 px-4">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest leading-relaxed">
                                        Use la cámara para identificar visualmente al socio.
                                    </p>
                                    {member && (
                                        <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex items-center justify-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest italic">SOCIO #{member.id}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Section */}
                            <div className="lg:col-span-3 space-y-10">
                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                                        <AlertCircle size={20} className="shrink-0" />
                                        <span className="text-xs font-black uppercase tracking-tight">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-[10px] font-black text-gym-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                            <div className="w-8 h-px bg-gym-primary/30" />
                                            DATOS PERSONALES
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">NOMBRE(S) *</label>
                                                <input
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                                    placeholder="Ej: Juan Antonio"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">APELLIDO(S) *</label>
                                                <input
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                                    placeholder="Ej: Pérez García"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">DOCUMENTO (DNI) *</label>
                                                <input
                                                    name="dni"
                                                    value={formData.dni}
                                                    onChange={handleChange}
                                                    required
                                                    maxLength={8}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-sm tracking-widest"
                                                    placeholder="12345678"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">FECHA DE NACIMIENTO</label>
                                                <input
                                                    type="date"
                                                    name="birthday"
                                                    value={formData.birthday}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] font-black text-gym-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2 pt-4">
                                            <div className="w-8 h-px bg-gym-primary/30" />
                                            CONTACTO Y ACCESO
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">TELÉFONO MÓVIL</label>
                                                <input
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                                    placeholder="999 999 999"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">CORREO ELECTRÓNICO</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                                    placeholder="juan@eiGYM.com"
                                                />
                                            </div>
                                            <div className="col-span-full space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">DIRECCIÓN DE DOMICILIO</label>
                                                <input
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-medium text-sm"
                                                    placeholder="Calle, Número, Distrito..."
                                                />
                                            </div>
                                            <div className="col-span-full space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">BIOMETRÍA (HUELLA DIGITAL)</label>
                                                <div className="flex gap-4">
                                                    <div className="relative flex-1 group">
                                                        <input
                                                            id="fingerprint-input"
                                                            name="fingerprintId"
                                                            value={formData.fingerprintId}
                                                            onChange={handleChange}
                                                            autoFocus={!!isEditing && !member}
                                                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-xs tracking-widest"
                                                            placeholder="ESCNEA HUELLA O INGRESA ID"
                                                        />
                                                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 group-focus-within:text-gym-primary transition-colors" size={20} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                const { registerBiometric } = await import('../lib/biometrics');
                                                                const id = await registerBiometric(formData.firstName || 'member');
                                                                setFormData(prev => ({ ...prev, fingerprintId: id }));
                                                            } catch (err: any) {
                                                                setError(err.message || 'No se pudo capturar la huella');
                                                            }
                                                        }}
                                                        id="capture-btn"
                                                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-slate-200 dark:shadow-none shrink-0"
                                                    >
                                                        Capturar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] font-black text-gym-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2 pt-4">
                                            <div className="w-8 h-px bg-gym-primary/30" />
                                            MEMBRESÍA Y PAGOS
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">
                                                    {member ? 'RENOVAR / REASIGNAR PLAN' : 'PLAN INICIAL *'}
                                                </label>
                                                <select
                                                    name="planId"
                                                    value={formData.planId}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-xs uppercase tracking-tight appearance-none cursor-pointer"
                                                >
                                                    <option value="" className="dark:bg-slate-900">-- {member ? 'SIN CAMBIOS' : 'SELECCIONAR PLAN'} --</option>
                                                    {plans.map(plan => (
                                                        <option key={plan.id} value={plan.id} className="dark:bg-slate-900">
                                                            {plan.name} - S/ {plan.price} ({plan.durationDays} DÍAS)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">MÉTODO DE PAGO</label>
                                                <select
                                                    name="paymentMethod"
                                                    value={formData.paymentMethod}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-xs uppercase tracking-tight appearance-none cursor-pointer"
                                                >
                                                    <option value="CASH" className="dark:bg-slate-900">EFECTIVO</option>
                                                    <option value="CARD" className="dark:bg-slate-900">TARJETA (DÉBITO/CRÉDITO)</option>
                                                    <option value="YAPE" className="dark:bg-slate-900">YAPE</option>
                                                    <option value="PLIN" className="dark:bg-slate-900">PLIN</option>
                                                    <option value="TRANSFER" className="dark:bg-slate-900">TRANSFERENCIA BANCARIA</option>
                                                </select>
                                            </div>
                                            <div className="col-span-full space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">NOTAS ADICIONALES</label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-medium text-sm min-h-[100px]"
                                                    placeholder="Información relevante sobre el socio..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 sm:px-10 py-6 sm:py-8 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 hover:text-slate-900 dark:hover:text-white transition-all order-2 sm:order-1"
                        >
                            Cancelar Registro
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-black px-12 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-gym-primary/20 uppercase tracking-widest text-sm min-w-[220px] order-1 sm:order-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} strokeWidth={3} />
                                    <span>{member ? 'Actualizar Socio' : 'Completar Registro'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MemberModal;
