import React, { useState, useEffect } from 'react';
import { Save, User, Shield, Bell, Monitor, Plus, Trash2, Loader2, Edit, MessageSquare, CreditCard, Calendar, Clock, Phone, Upload } from 'lucide-react';
import api from '../services/api';
import UserModal from '../components/UserModal';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN' ? 'general' : 'notifications');
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [whatsappTemplates, setWhatsappTemplates] = useState<any>({
        whatsapp_template_active: '',
        whatsapp_template_por_vencer: '',
        whatsapp_template_vencido: '',
        whatsapp_template_grupo: '',
        whatsapp_group_link: ''
    });
    const [generalSettings, setGeneralSettings] = useState<any>({
        gym_name: 'eiGYM Fitness Center',
        gym_email: 'contacto@eigym.com',
        gym_phone: '+51 987 654 321',
        gym_address: 'Av. Siempre Viva 123',
        gym_logo_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState<any>(null);

    const fetchLicenseStatus = async () => {
        try {
            const response = await api.get('/settings/license');
            setLicenseStatus(response.data);
        } catch (error) {
            console.error('Error fetching license:', error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleEditUser = (u: any) => {
        setSelectedUser(u);
        setIsModalOpen(true);
    };

    const handleNewUser = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const fetchUsers = async () => {
        if (currentUser?.role !== 'SUPERADMIN' && currentUser?.role !== 'ADMIN') return;
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('No se pudo eliminar el usuario');
        }
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/settings');
            setWhatsappTemplates({
                whatsapp_template_active: response.data.whatsapp_template_active || '',
                whatsapp_template_por_vencer: response.data.whatsapp_template_por_vencer || '',
                whatsapp_template_vencido: response.data.whatsapp_template_vencido || '',
                whatsapp_template_grupo: response.data.whatsapp_template_grupo || '',
                whatsapp_group_link: response.data.whatsapp_group_link || ''
            });
            setGeneralSettings({
                gym_name: response.data.gym_name || '',
                gym_email: response.data.gym_email || '',
                gym_phone: response.data.gym_phone || '',
                gym_address: response.data.gym_address || '',
                gym_logo_url: response.data.gym_logo_url || ''
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await api.post('/settings', {
                ...whatsappTemplates,
                ...generalSettings
            });
            alert('Ajustes guardados correctamente');
            // Notify layout to refresh logo
            window.dispatchEvent(new Event('settingsUpdated'));
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar los ajustes');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const extension = file.name.split('.').pop();

            try {
                setLoading(true);
                const response = await api.post('/settings/logo', {
                    image: base64String,
                    extension
                });
                setGeneralSettings({ ...generalSettings, gym_logo_url: response.data.logoUrl });
                // Notify layout to refresh logo
                window.dispatchEvent(new Event('settingsUpdated'));
            } catch (error) {
                console.error('Error uploading logo:', error);
                alert('Error al subir el logo');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'license' || activeTab === 'notifications') {
            fetchLicenseStatus();
        } else {
            fetchSettings();
        }
    }, [activeTab]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Configuración</h1>
                <p className="text-gray-400 dark:text-gray-500 mt-1">Administra los ajustes generales del sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && (
                        <>
                            <button
                                onClick={() => setActiveTab('general')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm uppercase tracking-tight",
                                    activeTab === 'general' ? "bg-gym-primary text-white shadow-xl shadow-gym-primary/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                <Monitor size={20} />
                                <span>General</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm uppercase tracking-tight",
                                    activeTab === 'users' ? "bg-gym-primary text-white shadow-xl shadow-gym-primary/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                <User size={20} />
                                <span>Usuarios Staff</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('whatsapp')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm uppercase tracking-tight",
                                    activeTab === 'whatsapp' ? "bg-gym-primary text-white shadow-xl shadow-gym-primary/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                            >
                                <MessageSquare size={20} />
                                <span>WhatsApp</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={cn(
                            "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm uppercase tracking-tight",
                            activeTab === 'notifications' ? "bg-gym-primary text-white shadow-xl shadow-gym-primary/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                    >
                        <Bell size={20} />
                        <span>Estado Suscripción</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {(activeTab === 'general') && (currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in duration-300 transition-colors">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ajustes Generales</h2>
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="relative group">
                                    <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 group-hover:border-gym-primary/50 transition-all">
                                        {generalSettings.gym_logo_url ? (
                                            <img
                                                src={generalSettings.gym_logo_url.startsWith('http') 
                                                    ? generalSettings.gym_logo_url 
                                                    : `${(api.defaults.baseURL || '').replace(/\/api\/?$/, '')}${generalSettings.gym_logo_url.startsWith('/') ? '' : '/'}${generalSettings.gym_logo_url}`}
                                                alt="Logo"
                                                className="w-full h-full object-contain p-2"
                                            />
                                        ) : (
                                            <Upload className="w-8 h-8 text-gray-300" />
                                        )}
                                    </div>
                                    <label className="absolute inset-0 cursor-pointer">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre del Gym</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                            value={generalSettings.gym_name}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, gym_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email de Contacto</label>
                                        <input
                                            type="email"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                            value={generalSettings.gym_email}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, gym_email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                            value={generalSettings.gym_phone}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, gym_phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dirección</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                            value={generalSettings.gym_address}
                                            onChange={(e) => setGeneralSettings({ ...generalSettings, gym_address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-black px-10 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-gym-primary/20 uppercase tracking-widest text-xs"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} strokeWidth={3} />}
                                    <span>Guardar Ajustes</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300 transition-colors text-slate-900 dark:text-white">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Usuarios Staff</h2>
                                <button
                                    onClick={handleNewUser}
                                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20 uppercase tracking-widest text-[10px]"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    <span>Nuevo Usuario</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                                            <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Nombre</th>
                                            <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Email</th>
                                            <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Rol</th>
                                            <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-widest px-2 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {users.map((u: any) => (
                                            <tr key={u.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 font-bold text-sm px-2">{u.name}</td>
                                                <td className="py-4 text-sm text-gray-500 dark:text-gray-400 px-2">{u.email}</td>
                                                <td className="py-4 px-2">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-md text-xs font-bold tracking-wider uppercase",
                                                        u.role === 'SUPERADMIN' ? "bg-red-500/10 text-red-500" :
                                                            u.role === 'ADMIN' ? "bg-gym-primary/10 text-gym-primary" :
                                                                u.role === 'RECEPTION' ? "bg-blue-500/10 text-blue-500" :
                                                                    "bg-gray-500/10 text-gray-500"
                                                    )}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right space-x-2 px-2">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="p-2 text-gray-400 hover:text-gym-primary transition-colors hover:bg-gym-primary/10 rounded-lg"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in duration-300 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de WhatsApp</h2>
                                    <p className="text-sm text-gray-400 font-medium">Plantillas de mensajes automáticos</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                        <span>Mensaje para Clientes Activos</span>
                                        <span className="text-[10px] lowercase font-normal italic opacity-60">Usa (nombre) para el nombre del cliente</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all min-h-[100px] resize-none"
                                        value={whatsappTemplates.whatsapp_template_active}
                                        onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_template_active: e.target.value })}
                                        placeholder="Hola (nombre), tu membresía está activa..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                        <span>Mensaje de Membresía por Vencer</span>
                                        <span className="text-[10px] lowercase font-normal italic opacity-60">Usa (nombre) y (fecha)</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all min-h-[100px] resize-none"
                                        value={whatsappTemplates.whatsapp_template_por_vencer}
                                        onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_template_por_vencer: e.target.value })}
                                        placeholder="Hola (nombre), tu membresía vence el (fecha)..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                        <span>Mensaje de Membresía Vencida</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all min-h-[100px] resize-none"
                                        value={whatsappTemplates.whatsapp_template_vencido}
                                        onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_template_vencido: e.target.value })}
                                        placeholder="Hola (nombre), tu membresía ha vencido..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Link del Grupo (Botón Directo)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                            value={whatsappTemplates.whatsapp_group_link}
                                            onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_group_link: e.target.value })}
                                            placeholder="https://chat.whatsapp.com/..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Texto Invitación Grupo</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                            value={whatsappTemplates.whatsapp_template_grupo}
                                            onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_template_grupo: e.target.value })}
                                            placeholder="Únete a nuestra comunidad..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-black px-10 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-gym-primary/20 uppercase tracking-widest text-xs"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} strokeWidth={3} />}
                                    <span>Guardar Ajustes WhatsApp</span>
                                </button>
                            </div>
                        </div>
                    )}


                    {activeTab === 'notifications' && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Estado de la Suscripción</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gym-primary/10 border border-gym-primary/20 rounded-3xl p-8 flex flex-col items-center text-center">
                                    <Calendar className="w-12 h-12 text-gym-primary mb-4" />
                                    <h3 className="text-sm font-bold text-gym-primary uppercase tracking-widest mb-2">Vencimiento</h3>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                                        {licenseStatus?.expirationDate ? new Date(licenseStatus.expirationDate).toLocaleDateString() : 'No establecida'}
                                    </p>
                                </div>
                                <div className={cn(
                                    "rounded-3xl p-8 flex flex-col items-center text-center border",
                                    licenseStatus?.isExpired ? "bg-red-500/10 border-red-500/20" : "bg-blue-500/10 border-blue-500/20"
                                )}>
                                    <Clock className={cn("w-12 h-12 mb-4", licenseStatus?.isExpired ? "text-red-500" : "text-blue-500")} />
                                    <h3 className={cn("text-sm font-bold uppercase tracking-widest mb-2", licenseStatus?.isExpired ? "text-red-500" : "text-blue-500")}>Días Restantes</h3>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white">{licenseStatus?.daysRemaining ?? '0'} días</p>
                                </div>
                            </div>
                            
                            {licenseStatus && licenseStatus.subscriptionAmount && Number(licenseStatus.subscriptionAmount) > 0 && (
                                <div className="bg-gym-primary/5 border border-gym-primary/10 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 bg-gym-primary/10 rounded-xl flex items-center justify-center text-gym-primary flex-shrink-0">
                                            <CreditCard size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase italic text-[10px] tracking-widest opacity-60">Monto de Suscripción</h4>
                                            <p className="text-3xl font-black text-gym-primary leading-none mt-1 italic">S/ {String(licenseStatus.subscriptionAmount || '0')}</p>
                                            {licenseStatus.subscriptionDescription && (
                                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-2 font-bold italic uppercase tracking-tighter">
                                                    {String(licenseStatus.subscriptionDescription)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-6">
                                <div className="flex gap-4 items-start">
                                    <Bell className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Recordatorio de Pago</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Recuerde renovar su membresía antes de la fecha de caducidad para evitar bloqueos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {currentUser?.role === 'ADMIN' && (
                                <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex flex-col items-center gap-2">
                                        <a href="https://wa.me/51952372009" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 text-gray-500 hover:text-green-500 transition-colors font-bold">
                                            <Phone className="w-4 h-4 text-blue-500" />
                                            <span>+51 952 372 009</span>
                                        </a>
                                        <p className="text-xs text-gray-400 text-center">
                                            Para renovar o extender su membresía, contacte a su área de **Superadministración** o al soporte técnico de eiGYM.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {['security', 'backup'].includes(activeTab) && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-3xl p-12 text-center space-y-4 animate-in fade-in duration-300 transition-colors">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto text-gray-300">
                                <Shield size={40} strokeWidth={1} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Módulo en Desarrollo</h2>
                            <p className="text-gray-400 max-w-sm mx-auto">Esta sección estará disponible en próximas actualizaciones del sistema eiGYM.</p>
                        </div>
                    )}
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchUsers}
                userToEdit={selectedUser}
                gymId={currentUser?.gymId}
            />
        </div>
    );
};

export default Settings;
