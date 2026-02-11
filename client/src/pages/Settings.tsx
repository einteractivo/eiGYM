import React, { useState, useEffect } from 'react';
import { Save, User, Shield, Bell, Monitor, Database, Plus, Trash2, Loader2, Edit } from 'lucide-react';
import api from '../services/api';
import UserModal from '../components/UserModal';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

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
        if (currentUser?.role !== 'SUPERADMIN') return;
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
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

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-gray-400 mt-1">Administra los ajustes generales del sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'general' ? 'bg-gym-primary text-white shadow-lg shadow-gym-primary/20' : 'bg-black/20 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Monitor size={20} />
                        <span className="font-medium">General</span>
                    </button>
                    {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && (
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-gym-primary text-white shadow-lg shadow-gym-primary/20' : 'bg-black/20 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <User size={20} />
                            <span className="font-medium">Usuarios (Staff)</span>
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'security' ? 'bg-gym-primary text-white shadow-lg shadow-gym-primary/20' : 'bg-black/20 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Shield size={20} />
                        <span className="font-medium">Seguridad</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'notifications' ? 'bg-gym-primary text-white shadow-lg shadow-gym-primary/20' : 'bg-black/20 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Bell size={20} />
                        <span className="font-medium">Notificaciones</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'backup' ? 'bg-gym-primary text-white shadow-lg shadow-gym-primary/20' : 'bg-black/20 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Database size={20} />
                        <span className="font-medium">Copia de Seguridad</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold">Información del Gimnasio</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Nombre del Gimnasio</label>
                                    <input
                                        type="text"
                                        defaultValue="eiGYM Fitness Center"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Correo de Contacto</label>
                                    <input
                                        type="email"
                                        defaultValue="contacto@eigym.com"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Teléfono</label>
                                    <input
                                        type="tel"
                                        defaultValue="+51 987 654 321"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Moneda</label>
                                    <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all">
                                        <option value="PEN">Soles (S/)</option>
                                    </select>
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Dirección</label>
                                    <input
                                        type="text"
                                        defaultValue="Av. Siempre Viva 123"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex justify-end">
                                <button className="bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20">
                                    <Save size={20} />
                                    <span>Guardar Cambios</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Users Management */}
                    {activeTab === 'users' && (currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && (
                        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Gestión de Staff</h2>
                                    <p className="text-gray-400">Administra los usuarios y sus niveles de acceso</p>
                                </div>
                                <button
                                    onClick={handleNewUser}
                                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                                >
                                    <Plus size={20} />
                                    <span>Nuevo Usuario</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-gray-400 text-sm">
                                            <th className="pb-4 font-medium">Usuario</th>
                                            <th className="pb-4 font-medium">Rol</th>
                                            <th className="pb-4 font-medium text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-gray-500">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                    Cargando usuarios...
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-gray-500">
                                                    No hay otros usuarios registrados
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((u: any) => (
                                                <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-gray-700/50 rounded-full flex items-center justify-center font-bold text-sm text-gym-primary">
                                                                {u.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">{u.name}</p>
                                                                <p className="text-xs text-gray-500">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={cn(
                                                            "px-2 py-1 rounded-md text-xs font-bold tracking-wider uppercase",
                                                            u.role === 'SUPERADMIN' ? "bg-red-500/10 text-red-500" :
                                                                u.role === 'ADMIN' ? "bg-gym-primary/10 text-gym-primary" :
                                                                    u.role === 'RECEPTION' ? "bg-blue-500/10 text-blue-500" :
                                                                        "bg-gray-500/10 text-gray-500"
                                                        )}>
                                                            {u.role === 'RECEPTION' ? 'Recepción' : u.role === 'TRAINER' ? 'Entrenador' : u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditUser(u)}
                                                                className="p-2 text-gray-400 hover:text-gym-primary hover:bg-gym-primary/10 rounded-lg transition-all"
                                                                title="Editar usuario"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                disabled={u.id === currentUser?.id}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                                                                title="Eliminar usuario"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {['security', 'notifications', 'backup'].includes(activeTab) && (
                        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 min-h-[400px]">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Shield size={32} className="text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">En construcción</h3>
                            <p className="text-gray-400 max-w-md">
                                Esta sección de configuración ({activeTab}) estará disponible próximamente. Estamos trabajando para brindarte las mejores herramientas.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchUsers}
                userToEdit={selectedUser}
            />
        </div>
    );
};

export default Settings;
