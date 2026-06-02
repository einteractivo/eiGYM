import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    User, 
    Mail, 
    ShieldCheck, 
    Trash2,
    Search,
    Shield,
    KeyRound,
    Edit,
    Eye,
    EyeOff
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface SaasUser {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

const SaasUsers = () => {
    const [users, setUsers] = useState<SaasUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editingUser, setEditingUser] = useState<SaasUser | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/saas/saas-users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching SaaS users:', error);
            toast.error('Error al cargar usuarios SaaS');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const updateData: any = {};
                if (formData.name) updateData.name = formData.name;
                if (formData.email) updateData.email = formData.email;
                if (formData.password && formData.password.trim() !== '') {
                    updateData.password = formData.password;
                }
                await api.put(`/saas/saas-users/${editingUser.id}`, updateData);
                toast.success('Usuario SaaS actualizado exitosamente');
            } else {
                await api.post('/saas/saas-users', formData);
                toast.success('Usuario SaaS creado exitosamente');
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '' });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    const handleEdit = (user: SaasUser) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este administrador global?')) return;
        try {
            await api.delete(`/saas/users/${id}`);
            toast.success('Administrador eliminado');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gym-primary/10 rounded-2xl flex items-center justify-center text-gym-primary">
                        <ShieldCheck size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Administradores SaaS</h1>
                        <p className="text-slate-500 dark:text-gray-400 font-medium">Gestión de usuarios con acceso global al sistema</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', password: '' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-3 bg-gym-primary hover:bg-gym-primary/90 text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gym-primary/20"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Nuevo Admin</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gym-primary transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar administradores por nombre o email..." 
                    className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-gym-primary rounded-2xl outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/5 animate-pulse" />
                    ))
                ) : filteredUsers.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-gym-primary/5 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gym-primary/5 rounded-bl-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="relative">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-gym-primary/10 rounded-xl flex items-center justify-center text-gym-primary font-black text-xl italic">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEdit(user)}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(user.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-1">{user.name}</h3>
                            <div className="flex items-center gap-2 text-gym-primary mb-4">
                                <Shield size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-50 dark:border-white/5">
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                    <Mail size={16} className="text-slate-400" />
                                    <span>{user.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic mb-8">
                                {editingUser ? 'Editar Administrador' : 'Nuevo Administrador Global'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic ml-1">Nombre Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-gym-primary transition-all text-sm"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic ml-1">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            required
                                            type="email" 
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-gym-primary transition-all text-sm"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic ml-1">
                                        Contraseña {editingUser && '(Dejar en blanco para no cambiar)'}
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            required={!editingUser}
                                            type={showPassword ? "text" : "password"} 
                                            placeholder={editingUser ? "••••••••" : ""} 
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:border-gym-primary transition-all text-sm"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gym-primary transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 px-6 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 rounded-2xl font-black uppercase italic tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] py-4 px-6 bg-gym-primary text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-lg shadow-gym-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {editingUser ? 'Guardar Cambios' : 'Crear Administrador'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaasUsers;
