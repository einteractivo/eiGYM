import React, { useState } from 'react';
import { X, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userToEdit?: any;
    initialRole?: string;
    gymId?: number | null;
    fixedRole?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess, userToEdit, initialRole, gymId, fixedRole }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: initialRole || 'RECEPTION',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                password: '', // Password stays empty unless changing
                role: userToEdit.role || initialRole || 'RECEPTION',
                notes: userToEdit.notes || ''
            });
        } else {
            setFormData({ name: '', email: '', password: '', role: initialRole || 'RECEPTION', notes: '' });
        }
    }, [userToEdit, isOpen, initialRole]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (userToEdit) {
                const updateData = { ...formData };
                if (!updateData.password) delete (updateData as any).password;
                await api.put(`/users/${userToEdit.id}`, updateData);
            } else {
                const payload: any = { ...formData };
                if (gymId) payload.gymId = gymId;
                await api.post('/users', payload);
            }
            onSuccess();
            onClose();
            setFormData({ name: '', email: '', password: '', role: 'RECEPTION', notes: '' });
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] w-full max-w-lg max-h-[95vh] flex flex-col shadow-[0_20px_70px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                <div className="flex justify-between items-center px-6 sm:px-10 py-6 sm:py-8 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0 transition-colors">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {userToEdit ? 'Editar Usuario' : 'Nuevo Usuario Staff'}
                        </h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Control de acceso al sistema</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                    <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-500 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                                <AlertCircle size={20} className="shrink-0" />
                                <span className="text-xs font-black uppercase tracking-tight">{error}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">NOMBRE COMPLETO *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                    placeholder="Ej: Juan Antonio Pérez"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">CORREO ELECTRÓNICO *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                    placeholder="staff@eigym.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">CONTRASEÑA {userToEdit && '(DEJAR EN BLANCO PARA NO CAMBIAR)'}</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!userToEdit}
                                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 pr-12 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-bold text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gym-primary transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">NIVEL DE ACCESO *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={fixedRole}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-black text-xs uppercase tracking-tight appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="ADMIN" className="dark:bg-slate-900">Administrador</option>
                                    <option value="RECEPTION" className="dark:bg-slate-900">Recepción</option>
                                    <option value="TRAINER" className="dark:bg-slate-900">Entrenador</option>
                                    <option value="SUPERADMIN" className="dark:bg-slate-900">Superadmin</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">OBSERVACIONES</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 transition-all font-medium text-sm resize-none"
                                    placeholder="..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 px-6 sm:px-10 py-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0 transition-colors">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gym-primary hover:bg-gym-primary/90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-black px-10 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-gym-primary/20 uppercase tracking-widest text-xs min-w-[200px]"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} strokeWidth={3} />
                                    <span>{userToEdit ? 'Actualizar' : 'Guardar'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
