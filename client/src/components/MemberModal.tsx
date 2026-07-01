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
        amountPaid: '',
        notes: ''
    });
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [fullMember, setFullMember] = useState<any>(null);

    const [showDebtPayment, setShowDebtPayment] = useState(false);
    const [debtPaymentMethod, setDebtPaymentMethod] = useState('CASH');
    const [debtPaymentAmount, setDebtPaymentAmount] = useState('');
    const [payingDebt, setPayingDebt] = useState(false);

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
                amountPaid: '',
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
                amountPaid: '',
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

    useEffect(() => {
        if (isOpen && member && !isEditing) {
            const fetchFullMember = async () => {
                try {
                    const response = await api.get(`/members/${member.id}`);
                    setFullMember(response.data);
                } catch (err) {
                    console.error('Error fetching full member', err);
                }
            };
            fetchFullMember();
        } else {
            setFullMember(null);
        }
    }, [isOpen, member, isEditing]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'dni') {
            // Only numbers, max 8 digits for Peruvian DNI
            const numericValue = value.replace(/\D/g, '').slice(0, 8);
            setFormData({ ...formData, [name]: numericValue });
            return;
        }

        if (name === 'planId') {
            const plan = plans.find(p => p.id === parseInt(value));
            setFormData({ 
                ...formData, 
                [name]: value,
                amountPaid: plan ? plan.price.toString() : ''
            });
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

    const handleDebtPayment = async (membershipId: number) => {
        if (!debtPaymentAmount || parseFloat(debtPaymentAmount) <= 0) return;
        setPayingDebt(true);
        try {
            await api.post('/payments', {
                memberId: member.id,
                membershipId,
                amount: parseFloat(debtPaymentAmount),
                method: debtPaymentMethod,
                type: 'INCOME',
                notes: 'Pago de deuda de membresía'
            });
            setShowDebtPayment(false);
            setDebtPaymentAmount('');
            // Refetch full member to update payments
            const response = await api.get(`/members/${member.id}`);
            setFullMember(response.data);
            
            // Note: in a real scenario we might need to notify parent to refresh overall member list 
            // but for payments it's mainly seen in this modal.
        } catch (err: any) {
            console.error('Error paying debt', err);
            alert(err.response?.data?.message || 'Error al procesar el pago');
        } finally {
            setPayingDebt(false);
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
                                        <div className="space-y-6">
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
                                            {(() => {
                                                if (!fullMember?.payments) return null;
                                                const membershipPayments = fullMember.payments.filter((p: any) => p.membershipId === activeMembership.id);
                                                const totalPaid = membershipPayments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0);
                                                const price = parseFloat(activeMembership.price);
                                                const debt = price - totalPaid;
                                                
                                                if (debt > 0.01) { // Adding small tolerance for floating point
                                                    return (
                                                        <div className="flex flex-col gap-3">
                                                            <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertCircle className="text-red-500" size={16} />
                                                                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Deuda Pendiente</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">
                                                                        S/ {debt.toFixed(2)}
                                                                    </div>
                                                                    {!showDebtPayment && (
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => {
                                                                                setDebtPaymentAmount(debt.toFixed(2));
                                                                                setShowDebtPayment(true);
                                                                            }}
                                                                            className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0"
                                                                        >
                                                                            Pagar Deuda
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {showDebtPayment && (
                                                                <div className="bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-500/20 p-4 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Monto a Pagar (S/)</label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={debtPaymentAmount}
                                                                                onChange={e => setDebtPaymentAmount(e.target.value)}
                                                                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-red-500/30 transition-all font-bold text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Método</label>
                                                                            <select
                                                                                value={debtPaymentMethod}
                                                                                onChange={e => setDebtPaymentMethod(e.target.value)}
                                                                                className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-red-500/30 transition-all font-bold text-sm cursor-pointer"
                                                                            >
                                                                                <option value="CASH" className="dark:bg-slate-900">EFECTIVO</option>
                                                                                <option value="CARD" className="dark:bg-slate-900">TARJETA</option>
                                                                                <option value="YAPE" className="dark:bg-slate-900">YAPE</option>
                                                                                <option value="PLIN" className="dark:bg-slate-900">PLIN</option>
                                                                                <option value="TRANSFER" className="dark:bg-slate-900">TRANSFERENCIA</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2 justify-end pt-2">
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => setShowDebtPayment(false)}
                                                                            className="text-[10px] font-bold text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 px-3 py-2 uppercase tracking-widest transition-colors"
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            disabled={payingDebt}
                                                                            onClick={() => handleDebtPayment(activeMembership.id)}
                                                                            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase px-6 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                                                        >
                                                                            {payingDebt ? 'Procesando...' : 'Confirmar Pago'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
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

                        {/* Payment History Full Width */}
                        {fullMember?.payments && fullMember.payments.length > 0 && (
                            <div className="mt-8 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-8 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-2 text-slate-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest mb-4">
                                    <CreditCard size={14} />
                                    <span>Historial de Pagos</span>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {fullMember.payments.map((payment: any) => (
                                        <div key={payment.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="text-sm font-black text-gym-primary uppercase">S/ {Number(payment.amount).toFixed(2)}</div>
                                                    <div className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                        {payment.method === 'CASH' ? 'EFECTIVO' : payment.method === 'CARD' ? 'TARJETA' : payment.method === 'YAPE' ? 'YAPE' : payment.method === 'PLIN' ? 'PLIN' : payment.method === 'TRANSFER' ? 'TRANSFERENCIA' : payment.method || 'PAGO'}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
                                                    {payment.notes || payment.description || 'Pago de membresía'}
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left sm:text-right shrink-0">
                                                {format(new Date(payment.date), "dd MMM yyyy, h:mm a", { locale: es })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                        {member && member.memberships?.[0] && new Date(member.memberships[0].endDate) >= new Date() ? (
                                            <div className="bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/20 p-6 rounded-2xl flex items-center gap-4 mb-6">
                                                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                                                <div>
                                                    <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">MEMBRESÍA VIGENTE</h4>
                                                    <p className="text-sm font-bold text-amber-700/70 dark:text-amber-400/70">
                                                        El socio ya tiene un plan activo. No es posible asignar uno nuevo hasta que el actual expire.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
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

                                                {formData.planId && (
                                                    <div className="col-span-full space-y-4 bg-gym-primary/5 p-6 rounded-2xl border-2 border-gym-primary/10">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gym-primary uppercase tracking-widest">MONTO A PAGAR (S/)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    name="amountPaid"
                                                                    value={formData.amountPaid}
                                                                    onChange={handleChange}
                                                                    className="w-full bg-white dark:bg-slate-900 border-2 border-transparent rounded-xl px-5 py-3 text-gym-primary focus:border-gym-primary/30 transition-all font-black text-lg shadow-sm"
                                                                    placeholder="0.00"
                                                                />
                                                                <p className="text-[9px] font-bold text-gym-primary/60 uppercase">Puedes ingresar un pago parcial</p>
                                                            </div>
                                                            <div className="flex flex-col justify-center">
                                                                <div className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-1">DIFERENCIA / DEUDA PENDIENTE</div>
                                                                {(() => {
                                                                    const plan = plans.find(p => p.id === parseInt(formData.planId));
                                                                    if (!plan) return null;
                                                                    const diff = parseFloat(plan.price) - (parseFloat(formData.amountPaid) || 0);
                                                                    return (
                                                                        <div className={cn(
                                                                            "text-2xl font-black uppercase tracking-tighter",
                                                                            diff > 0 ? "text-red-500" : diff < 0 ? "text-amber-500" : "text-green-500"
                                                                        )}>
                                                                            S/ {diff > 0 ? diff.toFixed(2) : "0.00"}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-y-6">
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
