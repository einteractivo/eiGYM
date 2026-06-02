import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, User, Mail, Phone, MapPin, FileText, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../services/api';

const GymRegistration: React.FC = () => {
    const [formData, setFormData] = useState({
        gymName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register-gym', formData);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al enviar la solicitud. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white dark:bg-gym-dark flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/80 dark:bg-black/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">¡Solicitud Enviada!</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
                        Gracias por tu interés en eiGYM. Hemos recibido tus datos y nuestro equipo se pondrá en contacto contigo muy pronto para completar el registro.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-slate-900 dark:bg-gym-primary text-white dark:text-slate-900 font-black py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gym-dark flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gym-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gym-accent/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white/80 dark:bg-black/40 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl">
                    <div className="flex flex-col items-center mb-10">
                        <Link to="/login" className="self-start flex items-center gap-2 text-gray-400 hover:text-gym-primary transition-colors mb-6 font-bold text-sm group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Volver al Login
                        </Link>
                        <div className="w-16 h-16 bg-slate-900 dark:bg-gym-primary rounded-2xl flex items-center justify-center font-black text-2xl italic mb-6 text-white dark:text-slate-900">
                            ei
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight text-center">Registra tu Gimnasio</h1>
                        <p className="text-gray-400 dark:text-gray-500 mt-3 font-medium text-center">Únete a la plataforma líder en gestión deportiva</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold">
                                {error}
                            </div>
                        )}

                        {/* SECTION: GYM INFO */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 italic">Información del Gimnasio</span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Gym Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Nombre Comercial</label>
                                    <div className="relative group">
                                        <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                        <input
                                            type="text"
                                            name="gymName"
                                            required
                                            value={formData.gymName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                            placeholder="Ej: Power Fit Center"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Teléfono / WhatsApp</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                            placeholder="+51 987 654 321"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Dirección del Local</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                        placeholder="Ubicación exacta"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION: ACCESS CREDENTIALS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gym-primary italic">Credenciales de Acceso</span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Email / User */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email / Usuario</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Contraseña</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                            placeholder="Crea tu contraseña"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center italic leading-relaxed">
                                Estas serán tus credenciales maestras para gestionar el gimnasio una vez aprobada la solicitud.
                            </p>
                        </div>

                        {/* SECTION: CONTACT DETAILS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 italic">Persona de Contacto</span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Name */}
                                <div className="space-y-2 md:col-span-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Nombre Completo</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                        <input
                                            type="text"
                                            name="contactName"
                                            required
                                            value={formData.contactName}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                            placeholder="Representante legal o admin"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2 md:col-span-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Notas (Opcional)</label>
                                    <div className="relative group">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-gym-primary transition-colors" size={20} />
                                        <input
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none focus:ring-4 focus:ring-gym-primary/5 focus:border-gym-primary transition-all font-bold text-sm"
                                            placeholder="Información adicional..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 dark:bg-gym-primary hover:bg-slate-800 dark:hover:bg-gym-primary/90 text-white dark:text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group uppercase tracking-widest text-xs mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Enviar Solicitud</span>
                                    <CheckCircle size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Link */}
                <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <a 
                        href="https://www.eistreaming.net" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 hover:text-gym-primary transition-colors italic group"
                    >
                        <span>Powered by:</span>
                        <span className="text-gray-500 dark:text-gray-400 group-hover:text-gym-primary transition-colors underline decoration-gym-primary/30 decoration-2 underline-offset-4">einteractivo</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default GymRegistration;
