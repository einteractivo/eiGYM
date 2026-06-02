import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Globe, 
    Users, 
    Search, 
    CheckCircle2, 
    XCircle,
    Building2,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    ShieldCheck,
    KeyRound,
    Trash2,
    Save,
    Eye,
    EyeOff
} from 'lucide-react';
import api, { getUploadUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
interface Gym {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
    email?: string;
    active: boolean;
    subscriptionPlan: string;
    subscriptionExpiresAt: string;
    subscriptionAmount?: number;
    subscriptionDescription?: string;
    _count?: {
        users: number;
        members: number;
    };
    users?: {
        id: number;
        name: string;
        email: string;
        role: string;
    }[];
}

interface GymRegistration {
    id: number;
    gymName: string;
    contactName: string;
    email: string;
    phone: string;
    address?: string;
    notes?: string;
    status: string;
    createdAt: string;
}

const SaasGyms = () => {
    const [activeTab, setActiveTab] = useState<'gyms' | 'requests' | 'settings'>('gyms');
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [registrations, setRegistrations] = useState<GymRegistration[]>([]);
    const [saasSettings, setSaasSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    // ... rest of states
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGym, setEditingGym] = useState<Gym | null>(null);
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [showUserPassword, setShowUserPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        subscriptionPlan: 'TRIAL',
        subscriptionAmount: 0,
        subscriptionDescription: '',
        logoUrl: '',
        registrationId: null as number | null,
        adminPassword: ''
    });

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedGymForUser, setSelectedGymForUser] = useState<Gym | null>(null);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [userFormData, setUserFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ADMIN'
    });

    useEffect(() => {
        fetchGyms();
        fetchRegistrations();
        fetchSaasSettings();
    }, []);

    const fetchSaasSettings = async () => {
        try {
            const response = await api.get('/saas/settings');
            setSaasSettings(response.data);
        } catch (error) {
            console.error('Error fetching SaaS settings:', error);
        }
    };

    const updateSaasSettings = async (settings: any) => {
        try {
            await api.post('/saas/settings', settings);
            toast.success('Ajustes actualizados');
            fetchSaasSettings();
            // Notificar al layout para actualización inmediata
            window.dispatchEvent(new Event('settingsUpdated'));
        } catch (error) {
            console.error('Error updating SaaS settings:', error);
            toast.error('Error al guardar ajustes');
        }
    };

    const fetchGyms = async () => {
        try {
            const response = await api.get('/saas/gyms');
            setGyms(response.data);
        } catch (error) {
            console.error('Error fetching gyms:', error);
            toast.error('Error al cargar gimnasios');
        } finally {
            setLoading(false);
        }
    };

    const fetchRegistrations = async () => {
        try {
            const response = await api.get('/saas/registrations');
            setRegistrations(response.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
    };

    const handleProcessRegistration = (reg: GymRegistration) => {
        setFormData({
            name: reg.gymName,
            slug: reg.gymName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            email: reg.email,
            phone: reg.phone,
            address: reg.address || '',
            subscriptionPlan: 'TRIAL',
            subscriptionAmount: 0,
            subscriptionDescription: '',
            logoUrl: '',
            registrationId: reg.id,
            adminPassword: ''
        });
        setEditingGym(null);
        setIsModalOpen(true);
        setActiveTab('gyms');
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, logoType: 'gym' | 'saas' | 'footer' = 'gym') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const extension = file.name.split('.').pop();

            try {
                const response = await api.post('/settings/logo', {
                    image: base64String,
                    extension
                });
                
                const logoUrl = response.data.logoUrl;

                if (logoType === 'saas') {
                    await updateSaasSettings({ saas_logo_url: logoUrl });
                } else if (logoType === 'footer') {
                    await updateSaasSettings({ saas_footer_logo_url: logoUrl });
                } else {
                    setFormData(prev => ({ ...prev, logoUrl }));
                    toast.success('Logo subido correctamente');
                }
            } catch (error) {
                console.error('Error uploading logo:', error);
                toast.error('Error al subir el logo');
            }
        };
        reader.readAsDataURL(file);
    };

    const updateRegistrationStatus = async (id: number, status: string) => {
        try {
            await api.put(`/saas/registrations/${id}/status`, { status });
            toast.success('Estado actualizado');
            fetchRegistrations();
        } catch {
            toast.error('Error al actualizar estado');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingGym) {
                await api.put(`/saas/gyms/${editingGym.id}`, formData);
                toast.success('Gimnasio actualizado');
            } else {
                await api.post('/saas/gyms', formData);
                toast.success('Gimnasio creado exitosamente');
                
                // If we were processing a registration, mark it as approved
                const reg = registrations.find(r => r.gymName === formData.name && r.email === formData.email);
                if (reg) {
                    await api.put(`/saas/registrations/${reg.id}/status`, { status: 'APPROVED' });
                    fetchRegistrations();
                }
            }
            setIsModalOpen(false);
            setEditingGym(null);
            setFormData({ 
                name: '', 
                slug: '', 
                email: '', 
                phone: '', 
                address: '', 
                subscriptionPlan: 'TRIAL', 
                subscriptionAmount: 0,
                subscriptionDescription: '',
                logoUrl: '',
                registrationId: null,
                adminPassword: ''
            });
            fetchGyms();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        }
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (editingUser) {
                if (!editingUser.id) {
                    toast.error('Error: No se encontró el ID del usuario. Cierra el modal y vuelve a intentar.');
                    console.error('[handleUserSubmit] editingUser has no id:', editingUser);
                    return;
                }
                const updateData: any = {};
                if (userFormData.name) updateData.name = userFormData.name;
                if (userFormData.email) updateData.email = userFormData.email;
                if (userFormData.role) updateData.role = userFormData.role;
                if (userFormData.password && userFormData.password.trim() !== '') {
                    updateData.password = userFormData.password;
                }
                console.log('[handleUserSubmit] PUT /saas/users/' + editingUser.id, updateData);
                await api.put(`/saas/users/${editingUser.id}`, updateData);
                toast.success('Usuario actualizado');
            } else {
                if (!selectedGymForUser) return;
                await api.post('/saas/users', {
                    ...userFormData,
                    gymId: selectedGymForUser.id
                });
                toast.success('Usuario administrador creado');
            }
            setIsUserModalOpen(false);
            setEditingUser(null);
            setUserFormData({ name: '', email: '', password: '', role: 'ADMIN' });
            fetchGyms();
        } catch (error: any) {
            console.error('[handleUserSubmit] Error:', error.response?.status, error.response?.data);
            toast.error(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    const toggleStatus = async (gym: Gym) => {
        try {
            await api.put(`/saas/gyms/${gym.id}`, { active: !gym.active });
            toast.success(`Gimnasio ${gym.active ? 'desactivado' : 'activado'}`);
            fetchGyms();
        } catch {
            toast.error('Error al cambiar estado');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás COMPLETAMENTE seguro de eliminar este gimnasio? Esta acción eliminará TODOS los datos asociados (miembros, ventas, pagos, etc.) y no se puede deshacer.')) {
            return;
        }

        try {
            await api.delete(`/saas/gyms/${id}`);
            toast.success('Gimnasio eliminado correctamente');
            fetchGyms();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar gimnasio');
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        
        try {
            await api.delete(`/saas/users/${id}`);
            toast.success('Usuario eliminado');
            fetchGyms();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar usuario');
        }
    };

    const filteredGyms = gyms.filter(gym => 
        gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                        Central <span className="text-gym-primary">SaaS</span>
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 font-medium mt-1">
                        Gestión global de gimnasios y suscripciones
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl flex">
                        <button 
                            onClick={() => setActiveTab('gyms')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic transition-all",
                                activeTab === 'gyms' ? "bg-white dark:bg-slate-800 text-gym-primary shadow-sm" : "text-slate-400"
                            )}
                        >
                            Gimnasios
                        </button>
                        <button 
                            onClick={() => setActiveTab('requests')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic transition-all relative",
                                activeTab === 'requests' ? "bg-white dark:bg-slate-800 text-gym-primary shadow-sm" : "text-slate-400"
                            )}
                        >
                            Solicitudes
                            {registrations.filter(r => r.status === 'PENDING').length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                                    {registrations.filter(r => r.status === 'PENDING').length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('settings')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic transition-all relative",
                                activeTab === 'settings' ? "bg-white dark:bg-slate-800 text-gym-primary shadow-sm" : "text-slate-400"
                            )}
                        >
                            Configuración
                        </button>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingGym(null);
                            setFormData({ 
                                name: '', 
                                slug: '', 
                                email: '', 
                                phone: '', 
                                address: '', 
                                subscriptionPlan: 'TRIAL', 
                                subscriptionAmount: 0,
                                subscriptionDescription: '',
                                logoUrl: '',
                                registrationId: null,
                                adminPassword: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-gym-primary hover:bg-gym-primary/90 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest italic transition-all shadow-lg shadow-gym-primary/20 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Nuevo Gimnasio
                    </button>
                </div>
            </div>

            {activeTab === 'gyms' && (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Total Gimnasios</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white italic">{gyms.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Miembros Totales</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white italic">
                                        {gyms.reduce((acc, gym) => acc + (gym._count?.members || 0), 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gym-primary/10 rounded-2xl flex items-center justify-center text-gym-primary">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Gimnasios Activos</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white italic">
                                        {gyms.filter(g => g.active).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text"
                                placeholder="Buscar gimnasio por nombre o slug..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Gyms List */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2rem] animate-pulse" />
                            ))
                        ) : filteredGyms.map(gym => (
                            <div key={gym.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gym-primary/5 transition-all duration-500">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-5">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                                {gym.logoUrl ? (
                                                    <img src={getUploadUrl(gym.logoUrl)} alt={gym.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Building2 size={32} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">{gym.name}</h3>
                                                    {gym.active ? (
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                    ) : (
                                                        <XCircle size={16} className="text-red-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-gym-primary uppercase tracking-widest italic flex items-center gap-1">
                                                    <Globe size={12} />
                                                    {gym.slug}.eigym.com
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-gym-primary/10 text-gym-primary text-[9px] font-black uppercase tracking-widest italic">
                                                        Plan {gym.subscriptionPlan}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase italic">
                                                        Vence: {new Date(gym.subscriptionExpiresAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={cn(
                                                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                                                gym.active ? "bg-green-100 text-green-600 dark:bg-green-500/10" : "bg-red-100 text-red-600 dark:bg-red-500/10"
                                            )}>
                                                {gym.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <button 
                                                onClick={() => toggleStatus(gym)}
                                                className="text-[10px] font-bold text-slate-400 hover:text-gym-primary uppercase tracking-tighter transition-colors"
                                            >
                                                Cambiar estado
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Miembros</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white italic">{gym._count?.members || 0}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-1">Personal</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white italic">{gym.users?.length || 0}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-gray-50 dark:border-white/5">
                                        {gym.email && (
                                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                                <Mail size={16} className="text-slate-400" />
                                                <span>{gym.email}</span>
                                            </div>
                                        )}
                                        {gym.phone && (
                                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                                <Phone size={16} className="text-slate-400" />
                                                <span>{gym.phone}</span>
                                            </div>
                                        )}
                                        {gym.address && (
                                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                                                <MapPin size={16} className="text-slate-400" />
                                                <span>{gym.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Users Section */}
                                    <div className="mt-8 pt-6 border-t border-gray-50 dark:border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic mb-4">Personal del Gimnasio</p>
                                        <div className="space-y-2">
                                            {gym.users && gym.users.length > 0 ? gym.users.map((user: any) => (
                                                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] hover:bg-gym-primary/5 transition-all group/user">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gym-primary/10 flex items-center justify-center text-[10px] font-black text-gym-primary italic">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{user.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.role} • {user.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingUser(user);
                                                                setUserFormData({
                                                                    name: user.name,
                                                                    email: user.email,
                                                                    password: '',
                                                                    role: user.role
                                                                });
                                                                setIsUserModalOpen(true);
                                                            }}
                                                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-gym-primary opacity-0 group-hover/user:opacity-100 transition-all italic"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 opacity-0 group-hover/user:opacity-100 transition-all italic"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-[10px] text-slate-400 italic">No hay usuarios asignados</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-white/[0.02] px-8 py-4 flex justify-between items-center border-t border-gray-50 dark:border-white/5">
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => {
                                                setEditingGym(gym);
                                                setFormData({
                                                    name: gym.name,
                                                    slug: gym.slug,
                                                    email: gym.email || '',
                                                    phone: gym.phone || '',
                                                    address: gym.address || '',
                                                    subscriptionPlan: gym.subscriptionPlan,
                                                    subscriptionAmount: gym.subscriptionAmount || 0,
                                                    subscriptionDescription: gym.subscriptionDescription || '',
                                                    logoUrl: gym.logoUrl || '',
                                                    registrationId: null,
                                                    adminPassword: ''
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="text-xs font-black uppercase tracking-widest italic text-slate-600 dark:text-gray-400 hover:text-gym-primary transition-colors"
                                        >
                                            Editar Detalles
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedGymForUser(gym);
                                                setIsUserModalOpen(true);
                                            }}
                                            className="text-xs font-black uppercase tracking-widest italic text-gym-primary hover:text-gym-primary/80 transition-colors flex items-center gap-1"
                                        >
                                            <ShieldCheck size={14} /> Crear Admin
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(gym.id)}
                                            className="text-xs font-black uppercase tracking-widest italic text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                    <a 
                                        href={`https://${gym.slug}.eigym.com`} 
                                        target="_blank"
                                        className="flex items-center gap-1 text-xs font-black uppercase tracking-widest italic text-gym-primary hover:underline"
                                    >
                                        Visitar <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'requests' && (
                /* Registrations List */
                <div className="space-y-6">
                    {registrations.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center">
                            <p className="text-slate-400 font-medium">No hay solicitudes de registro pendientes</p>
                        </div>
                    ) : (
                        registrations.map(reg => (
                            <div key={reg.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm group hover:shadow-xl hover:shadow-gym-primary/5 transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex gap-5">
                                        <div className="w-16 h-16 bg-gym-primary/10 rounded-2xl flex items-center justify-center text-gym-primary font-black italic text-xl">
                                            {reg.gymName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">{reg.gymName}</h3>
                                                <span className={cn(
                                                    "px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest italic",
                                                    reg.status === 'PENDING' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10" : 
                                                    reg.status === 'APPROVED' ? "bg-green-100 text-green-600 dark:bg-green-500/10" :
                                                    "bg-red-100 text-red-600 dark:bg-red-500/10"
                                                )}>
                                                    {reg.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 italic">
                                                Contacto: {reg.contactName} • {new Date(reg.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {reg.status === 'PENDING' && (
                                            <>
                                                <button 
                                                    onClick={() => handleProcessRegistration(reg)}
                                                    className="bg-gym-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic hover:bg-gym-primary/90 transition-all"
                                                >
                                                    Procesar / Crear
                                                </button>
                                                <button 
                                                    onClick={() => updateRegistrationStatus(reg.id, 'REJECTED')}
                                                    className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                >
                                                    Rechazar
                                                </button>
                                            </>
                                        )}
                                        {reg.status !== 'PENDING' && (
                                            <button 
                                                onClick={() => updateRegistrationStatus(reg.id, 'PENDING')}
                                                className="text-xs font-bold text-slate-400 hover:text-gym-primary italic underline"
                                            >
                                                Mover a Pendientes
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-50 dark:border-white/5">
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400 font-medium">
                                        <Mail size={16} className="text-slate-400" />
                                        {reg.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400 font-medium">
                                        <Phone size={16} className="text-slate-400" />
                                        {reg.phone}
                                    </div>
                                    {reg.address && (
                                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400 font-medium">
                                            <MapPin size={16} className="text-slate-400" />
                                            {reg.address}
                                        </div>
                                    )}
                                </div>
                                {reg.notes && (
                                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] text-sm text-slate-500 dark:text-gray-400 font-medium italic">
                                        "{reg.notes}"
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-10 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex flex-col items-center gap-8">
                                <div className="text-center">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic mb-2 tracking-tight">Identidad de la Plataforma</h2>
                                    <p className="text-slate-500 dark:text-gray-400 font-medium">Personaliza el logo que se muestra globalmente en el panel SaaS</p>
                                </div>

                                <div className="relative group/saas-logo">
                                    <div className="w-48 h-48 bg-slate-50 dark:bg-white/[0.02] rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover/saas-logo:border-gym-primary/50">
                                        {saasSettings?.saas_logo_url ? (
                                            <img 
                                                src={getUploadUrl(saasSettings.saas_logo_url)} 
                                                alt="Logo SaaS" 
                                                className="w-full h-full object-contain p-4" 
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <Globe size={64} strokeWidth={1} />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">Sin Logo Definido</span>
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 group-hover/saas-logo:opacity-100 transition-all cursor-pointer rounded-[2.5rem] backdrop-blur-sm">
                                        <Plus size={32} strokeWidth={3} className="mb-2" />
                                        <span className="text-xs font-black uppercase tracking-widest italic">Cambiar Logo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'saas' as any)} />
                                    </label>
                                </div>

                                <div className="w-full pt-8 border-t border-gray-50 dark:border-white/5 space-y-8">
                                    <div className="text-center">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic mb-1 tracking-tight">Pie de Página (Footer)</h3>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Personaliza la firma que aparece en la parte inferior de la plataforma</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5">
                                            <div className="relative group/footer-logo">
                                                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover/footer-logo:border-gym-primary/50">
                                                    {saasSettings?.saas_footer_logo_url ? (
                                                        <img 
                                                            src={getUploadUrl(saasSettings.saas_footer_logo_url)} 
                                                            alt="Logo Footer" 
                                                            className="w-full h-full object-contain p-2" 
                                                        />
                                                    ) : (
                                                        <Plus size={20} className="text-slate-300" />
                                                    )}
                                                </div>
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover/footer-logo:opacity-100 transition-all cursor-pointer rounded-2xl backdrop-blur-[2px]">
                                                    <Plus size={24} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'footer' as any)} />
                                                </label>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Texto del Footer</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Ej: Powered by:"
                                                        className="flex-1 bg-white dark:bg-slate-900 border-transparent rounded-xl py-2 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                                        value={saasSettings?.saas_footer_text || ''}
                                                        onChange={(e) => setSaasSettings({...saasSettings, saas_footer_text: e.target.value})}
                                                    />
                                                    <button 
                                                        onClick={() => updateSaasSettings({ saas_footer_text: saasSettings.saas_footer_text })}
                                                        className="bg-gym-primary text-white p-2 rounded-xl hover:bg-gym-primary/90 transition-all"
                                                    >
                                                        <Save size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Empresa / Marca</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Ej: Einteractivo"
                                                        className="flex-1 bg-white dark:bg-slate-900 border-transparent rounded-xl py-2 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                                        value={saasSettings?.saas_footer_brand || ''}
                                                        onChange={(e) => setSaasSettings({...saasSettings, saas_footer_brand: e.target.value})}
                                                    />
                                                    <button 
                                                        onClick={() => updateSaasSettings({ saas_footer_brand: saasSettings.saas_footer_brand })}
                                                        className="bg-gym-primary text-white p-2 rounded-xl hover:bg-gym-primary/90 transition-all"
                                                    >
                                                        <Save size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-2">Enlace (URL)</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="https://..."
                                                        className="flex-1 bg-white dark:bg-slate-900 border-transparent rounded-xl py-2 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                                        value={saasSettings?.saas_footer_url || ''}
                                                        onChange={(e) => setSaasSettings({...saasSettings, saas_footer_url: e.target.value})}
                                                    />
                                                    <button 
                                                        onClick={() => updateSaasSettings({ saas_footer_url: saasSettings.saas_footer_url })}
                                                        className="bg-gym-primary text-white p-2 rounded-xl hover:bg-gym-primary/90 transition-all"
                                                    >
                                                        <Save size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gym-primary/5 rounded-2xl border border-gym-primary/10">
                                        <p className="text-xs text-gym-primary font-medium text-center italic">
                                            Estos cambios se aplicarán globalmente en el pie de página de toda la plataforma.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-[2.5rem] border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300 custom-scrollbar">
                        <div className="p-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic mb-6">
                                {editingGym ? 'Editar Gimnasio' : 'Nuevo Gimnasio'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div className="relative group/logo">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                                            {formData.logoUrl ? (
                                                <img src={getUploadUrl(formData.logoUrl)} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <Globe size={32} className="text-slate-300" />
                                            )}
                                        </div>
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover/logo:opacity-100 transition-all cursor-pointer rounded-3xl">
                                            <Plus size={24} />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        </label>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mt-2">Logo del Gimnasio</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Nombre del Gimnasio</label>
                                        <input 
                                            required
                                            type="text"
                                            placeholder="Ej: Power Fitness"
                                            className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Slug (URL)</label>
                                        <input 
                                            required
                                            type="text"
                                            placeholder="ej: power-fitness"
                                            className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                                            disabled={!!editingGym}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Email</label>
                                        <input 
                                            type="email"
                                            className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Teléfono</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Dirección</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Plan de Suscripción</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                        value={formData.subscriptionPlan}
                                        onChange={(e) => setFormData({...formData, subscriptionPlan: e.target.value})}
                                    >
                                        <option value="TRIAL">Plan Prueba (7 días)</option>
                                        <option value="MONTHLY">Plan Mensual (30 días)</option>
                                        <option value="ANNUAL">Plan Anual (365 días)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Monto Mensual (S/)</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                            value={formData.subscriptionAmount}
                                            onChange={(e) => setFormData({...formData, subscriptionAmount: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Descripción Cobro</label>
                                        <input 
                                            type="text"
                                            placeholder="Ej: Pago mensual SaaS"
                                            className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                            value={formData.subscriptionDescription}
                                            onChange={(e) => setFormData({...formData, subscriptionDescription: e.target.value})}
                                        />
                                    </div>
                                </div>
                                {!editingGym && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">
                                            {formData.registrationId ? 'Contraseña (Definida en registro)' : 'Contraseña del Administrador'}
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showAdminPassword ? "text" : "password"} 
                                                placeholder={formData.registrationId ? '••••••••' : 'Asigna una contraseña'}
                                                className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 pl-4 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                                value={formData.adminPassword}
                                                onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gym-primary transition-colors focus:outline-none"
                                            >
                                                {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {formData.registrationId && (
                                            <p className="text-[9px] text-gym-primary font-bold italic ml-4">
                                                * Se usará la contraseña del registro a menos que escribas una nueva aquí.
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 py-4 rounded-2xl font-black uppercase tracking-widest italic hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-gym-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest italic hover:bg-gym-primary/90 transition-all shadow-lg shadow-gym-primary/20"
                                    >
                                        {editingGym ? 'Guardar Cambios' : 'Crear Gimnasio'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Admin User Modal */}
            {isUserModalOpen && (selectedGymForUser || editingUser) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gym-primary/10 rounded-2xl flex items-center justify-center text-gym-primary">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">
                                        {editingUser ? 'Editar Usuario' : 'Nuevo Administrador'}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                                        {editingUser ? `Modificando a: ${editingUser.name}` : `Asignar a: ${selectedGymForUser?.name}`}
                                    </p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleUserSubmit} className="space-y-4" noValidate>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Nombre Completo</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                        value={userFormData.name}
                                        onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Correo Electrónico</label>
                                    <input 
                                        required
                                        type="email"
                                        placeholder="admin@ejemplo.com"
                                        className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                        value={userFormData.email}
                                        onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">
                                        Contraseña {editingUser && '(Dejar en blanco para no cambiar)'}
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            required={!editingUser}
                                            type={showUserPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 pl-12 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                            value={userFormData.password}
                                            onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowUserPassword(!showUserPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gym-primary transition-colors focus:outline-none"
                                        >
                                            {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-4">Rol del Usuario</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-white/[0.02] border-transparent rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 transition-all outline-none"
                                        value={userFormData.role}
                                        onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                                    >
                                        <option value="ADMIN">Administrador del Gym</option>
                                        <option value="RECEPTION">Recepcionista</option>
                                    </select>
                                </div>
                                
                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setIsUserModalOpen(false)}
                                        className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 py-4 rounded-2xl font-black uppercase tracking-widest italic hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-gym-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest italic hover:bg-gym-primary/90 transition-all shadow-lg shadow-gym-primary/20"
                                    >
                                        {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
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

export default SaasGyms;
