import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Camera, Fingerprint, Edit, Calendar, CreditCard, User } from 'lucide-react';
import api from '../services/api';
import WebcamCapture from './WebcamCapture';

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-6 border-b border-white/10 bg-gray-900 sticky top-0 z-10">
                        <h2 className="text-xl font-bold text-white">Detalles del Miembro</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Left Column: Photo & Status */}
                            <div className="flex flex-col items-center gap-4 md:w-1/3">
                                <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-white/10 bg-black/40">
                                    {member.photoUrl ? (
                                        <img src={member.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                    }`}>
                                    {isExpired ? 'Membresía Vencida' : 'Membresía Activa'}
                                </div>
                            </div>

                            {/* Right Column: Info */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{member.firstName} {member.lastName}</h3>
                                    <p className="text-gray-400">DNI: {member.dni}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl space-y-1">
                                        <div className="text-xs text-gray-400 uppercase tracking-wide">Teléfono</div>
                                        <div className="font-medium text-white">{member.phone || 'N/A'}</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl space-y-1">
                                        <div className="text-xs text-gray-400 uppercase tracking-wide">Email</div>
                                        <div className="font-medium text-white truncate" title={member.email}>{member.email || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="bg-gym-primary/10 border border-gym-primary/20 p-5 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-gym-primary font-bold">
                                        <CreditCard size={20} />
                                        <span>Plan Actual</span>
                                    </div>
                                    {activeMembership ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase">Plan</div>
                                                <div className="font-semibold text-white text-lg">
                                                    {activeMembership.plan?.name || 'Desconocido'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase flex items-center gap-1">
                                                    <Calendar size={12} /> Vence
                                                </div>
                                                <div className={`font-semibold text-lg ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                                                    {new Date(activeMembership.endDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No tiene membresía registrada.</p>
                                    )}
                                    {member.notes && (
                                        <div className="bg-white/5 p-5 rounded-2xl space-y-2">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider">
                                                <Edit size={14} />
                                                <span>Anotaciones</span>
                                            </div>
                                            <p className="text-gray-300 whitespace-pre-wrap">{member.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-gray-900/50">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-white text-black font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors"
                        >
                            <Edit size={18} />
                            <span>Editar Información</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Edit/Create Mode Component
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-gray-900 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white">
                        {member ? 'Editar Miembro' : 'Nuevo Miembro'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Photo Section */}
                    <div className="lg:col-span-1 flex flex-col items-center gap-4">
                        <div className="w-full aspect-square bg-black/40 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group">
                            {showWebcam ? (
                                <WebcamCapture onCapture={(src) => {
                                    setPhoto(src);
                                    setShowWebcam(false);
                                }} />
                            ) : photo ? (
                                <>
                                    <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setShowWebcam(true)}
                                            className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition-colors"
                                        >
                                            <Camera size={20} />
                                        </button>
                                        <button
                                            onClick={() => setPhoto(null)}
                                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowWebcam(true)}
                                    className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <Camera size={48} />
                                    <span className="text-sm font-medium">Torna Foto</span>
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Usa la cámara web para tomar una foto de perfil del miembro.
                        </p>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Nombres *</label>
                                <input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    placeholder="Ej: Juan"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Apellidos *</label>
                                <input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    placeholder="Ej: Pérez"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">DNI *</label>
                                <input
                                    name="dni"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    required
                                    maxLength={8}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    placeholder="12345678"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Teléfono</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    placeholder="999 999 999"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    placeholder="juan@ejemplo.com"
                                />
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-sm font-medium text-gray-300">Dirección</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    placeholder="Av. Principal 123"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">ID Huella Digital</label>
                                <div className="flex gap-2 relative">
                                    <input
                                        id="fingerprint-input"
                                        name="fingerprintId"
                                        value={formData.fingerprintId}
                                        onChange={handleChange}
                                        autoFocus={!!isEditing && !member}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all pl-10"
                                        placeholder="Escanea huella o ingresa ID manual"
                                    />
                                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const name = formData.firstName ? `${formData.firstName} ${formData.lastName}` : `Usuario ${Date.now()}`;
                                                // Dynamic import to avoid SSR issues if any, though here it's client-side
                                                const { registerBiometric } = await import('../lib/biometrics');

                                                // Visual feedback
                                                const btn = document.getElementById('capture-btn');
                                                if (btn) btn.innerText = 'Escaneando...';

                                                const credentialId = await registerBiometric(name);
                                                setFormData(prev => ({ ...prev, fingerprintId: credentialId }));

                                                if (btn) btn.innerText = 'Capturar';
                                            } catch (err: any) {
                                                console.error(err);
                                                let errorMessage = 'Error técnico: ' + err.message;

                                                if (err.name === 'SecurityError' || err.message.includes('invalid domain') || err.message.includes('document.domain')) {
                                                    errorMessage = '⚠️ ERROR DE DOMINIO:\n\n' +
                                                        'El lector de huellas NO funciona usando una dirección IP (como 192.168.x.x).\n\n' +
                                                        'SOLUCIÓN:\n' +
                                                        '1. Si estás en la PC servidor, entra a: https://localhost:5173\n' +
                                                        '2. Si estás en otra PC, necesitas configurar un Dominio (ej. aigym.local) y HTTPS.';
                                                }

                                                alert('Para usar el lector Digital Persona:\n1. Asegúrate de tener el driver WBF instalado.\n2. Configura "Windows Hello" en tu PC.\n\n' + errorMessage);
                                                const btn = document.getElementById('capture-btn');
                                                if (btn) btn.innerText = 'Capturar';
                                            }
                                        }}
                                        id="capture-btn"
                                        className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl transition-colors text-sm font-medium whitespace-nowrap"
                                        title="Registrar con Biometría"
                                    >
                                        Capturar
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    El navegador solicitará verificar tu identidad (Huella/Pin).
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    {member ? 'Renovar/Asignar Plan' : 'Plan Inicial'}
                                </label>
                                <select
                                    name="planId"
                                    value={formData.planId}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                >
                                    <option value="">-- {member ? 'Sin cambios' : 'Seleccionar Plan'} --</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - S/ {plan.price} ({plan.durationDays} días)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Método de Pago</label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                >
                                    <option value="CASH">Efectivo</option>
                                    <option value="CARD">Tarjeta</option>
                                    <option value="TRANSFER">Transferencia</option>
                                    <option value="YAPE">Yape</option>
                                    <option value="PLIN">Plin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Guardar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form >
                </div >
            </div >
        </div >
    );
};

export default MemberModal;
