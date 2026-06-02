import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Dumbbell, MapPin, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import EquipmentService, { type Equipment } from '../services/EquipmentService';
import EquipmentModal from '../components/EquipmentModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

const EquipmentPage: React.FC = () => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

    useEffect(() => {
        fetchEquipment();
    }, [search, statusFilter]);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const data = await EquipmentService.getAllEquipment(search, statusFilter);
            setEquipment(data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Equipment) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este equipo del registro?')) {
            try {
                await EquipmentService.deleteEquipment(id);
                fetchEquipment();
            } catch (error) {
                console.error('Error deleting equipment:', error);
            }
        }
    };

    const openCreateModal = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'OPERATIONAL':
                return {
                    bg: 'bg-green-50 text-green-600 border border-green-100 shadow-sm',
                    text: 'text-green-600',
                    icon: <CheckCircle2 size={14} strokeWidth={2.5} />,
                    label: 'Operativo'
                };
            case 'MAINTENANCE':
                return {
                    bg: 'bg-orange-50 text-orange-600 border border-orange-100 shadow-sm',
                    text: 'text-orange-600',
                    icon: <Wrench size={14} strokeWidth={2.5} />,
                    label: 'Mantenimiento'
                };
            case 'OUT_OF_SERVICE':
                return {
                    bg: 'bg-red-50 text-red-600 border border-red-100 shadow-sm',
                    text: 'text-red-600',
                    icon: <AlertTriangle size={14} strokeWidth={2.5} />,
                    label: 'Fuera de Servicio'
                };
            default:
                return { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: null, label: status };
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-12 transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-300">
                <div>
                    
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-black uppercase tracking-widest italic">Gestión y control de mantenimiento</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-slate-900 dark:bg-gym-primary hover:bg-slate-800 dark:hover:bg-gym-primary/90 text-white dark:text-slate-900 font-black px-8 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-none uppercase tracking-widest text-xs active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span>Registrar Equipo</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[400px] transition-colors duration-300">
                {/* Filters */}
                <div className="p-10 border-b border-gray-50 dark:border-white/5 flex flex-col lg:flex-row gap-6 bg-white dark:bg-slate-900">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within:text-gym-primary transition-colors" size={20} strokeWidth={2.5} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, descripción o ubicación..."
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[1.5rem] px-8 py-4 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/10 focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-black uppercase tracking-widest text-xs cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="" className="dark:bg-slate-900">Todos los Estados</option>
                        <option value="OPERATIONAL" className="dark:bg-slate-900">🟢 Operativo</option>
                        <option value="MAINTENANCE" className="dark:bg-slate-900">🟠 Mantenimiento</option>
                        <option value="OUT_OF_SERVICE" className="dark:bg-slate-900">🔴 Fuera de Servicio</option>
                    </select>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/5 text-slate-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-50 dark:border-white/5 transition-colors">
                                <th className="py-6 px-10">Equipo</th>
                                <th className="py-6 px-10">Ubicación</th>
                                <th className="py-6 px-10">Último Manto.</th>
                                <th className="py-6 px-10">Estado</th>
                                <th className="py-6 px-10 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="py-10 px-10">
                                            <div className="h-4 bg-gray-50 rounded-full w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : equipment.length > 0 ? (
                                equipment.map((item) => {
                                    const status = getStatusStyles(item.status);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group">
                                            <td className="py-8 px-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="flex-shrink-0 w-16 h-16 rounded-[1.25rem] overflow-hidden border-2 border-slate-100 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm ring-4 ring-gray-50 dark:ring-white/5 group-hover:ring-gym-primary/5 transition-all">
                                                        {item.photoUrl ? (
                                                            <img
                                                                src={item.photoUrl}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100?text=Gym')}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-white/5 text-slate-300 dark:text-gray-600 group-hover:bg-gym-primary group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-500">
                                                                <Dumbbell size={24} strokeWidth={2.5} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight group-hover:text-gym-primary transition-colors">{item.name}</p>
                                                        {item.description && (
                                                            <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest italic mt-0.5 line-clamp-1">{item.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-8 px-10">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">
                                                    <MapPin size={16} className="text-gym-primary" strokeWidth={2.5} />
                                                    {item.location || 'Sin Ubicación'}
                                                </div>
                                            </td>
                                            <td className="py-8 px-10">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-900 dark:text-white font-black tracking-tighter uppercase">
                                                        {item.lastMaintenance
                                                            ? format(new Date(item.lastMaintenance), "d LLL, yyyy", { locale: es })
                                                            : 'Sin Registro'
                                                        }
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-widest italic mt-0.5">Calendario</span>
                                                </div>
                                            </td>
                                            <td className="py-8 px-10">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                                    status.bg
                                                )}>
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                            </td>
                                            <td className="py-8 px-10 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-3 bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-gym-primary hover:text-white dark:hover:text-slate-900 rounded-xl transition-all text-slate-400 dark:text-gray-500 shadow-sm border border-slate-100 dark:border-white/10 hover:border-slate-900 dark:hover:border-gym-primary"
                                                    >
                                                        <Edit2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-3 bg-gray-50 dark:bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all text-slate-400 dark:text-gray-500 shadow-sm border border-slate-100 dark:border-white/10 hover:border-red-500 dark:hover:border-red-500"
                                                    >
                                                        <Trash2 size={18} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center text-slate-200 dark:text-gray-800">
                                        <Dumbbell size={64} strokeWidth={1} className="mx-auto mb-6 opacity-50" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">No se registró equipamiento aún</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EquipmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchEquipment}
                equipment={selectedItem}
            />
        </div>
    );
};

export default EquipmentPage;
