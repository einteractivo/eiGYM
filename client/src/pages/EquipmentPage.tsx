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
                    bg: 'bg-green-500/10',
                    text: 'text-green-500',
                    icon: <CheckCircle2 size={16} />,
                    label: 'Operativo'
                };
            case 'MAINTENANCE':
                return {
                    bg: 'bg-yellow-500/10',
                    text: 'text-yellow-500',
                    icon: <Wrench size={16} />,
                    label: 'Mantenimiento'
                };
            case 'OUT_OF_SERVICE':
                return {
                    bg: 'bg-red-500/10',
                    text: 'text-red-500',
                    icon: <AlertTriangle size={16} />,
                    label: 'Fuera de Servicio'
                };
            default:
                return { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: null, label: status };
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Maquinaria y Equipos</h1>
                    <p className="text-gray-400 mt-1">Gestión y control de mantenimiento del equipamiento del gym</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                >
                    <Plus size={20} />
                    <span>Registrar Equipo</span>
                </button>
            </div>

            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col min-h-[400px]">
                {/* Filters */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, descripción o ubicación..."
                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-2xl px-6 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 transition-all font-medium"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="OPERATIONAL">Operativo</option>
                        <option value="MAINTENANCE">Mantenimiento</option>
                        <option value="OUT_OF_SERVICE">Fuera de Servicio</option>
                    </select>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase font-bold tracking-widest">
                                <th className="py-4 px-6">Equipo</th>
                                <th className="py-4 px-6">Ubicación</th>
                                <th className="py-4 px-6">Último Manto.</th>
                                <th className="py-4 px-6">Estado</th>
                                <th className="py-4 px-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="py-8 px-6">
                                            <div className="h-4 bg-white/5 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : equipment.length > 0 ? (
                                equipment.map((item) => {
                                    const status = getStatusStyles(item.status);
                                    return (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-gym-primary/10 rounded-2xl text-gym-primary group-hover:bg-gym-primary group-hover:text-white transition-all">
                                                        <Dumbbell size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white uppercase text-sm tracking-tight">{item.name}</p>
                                                        {item.description && (
                                                            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                                    <MapPin size={14} className="text-gym-primary" />
                                                    {item.location || 'No especificada'}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white font-medium">
                                                        {item.lastMaintenance
                                                            ? format(new Date(item.lastMaintenance), "d MMM, yyyy", { locale: es })
                                                            : 'Sin registro'
                                                        }
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">Mantenimiento</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight",
                                                    status.bg,
                                                    status.text
                                                )}>
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2.5 bg-white/5 hover:bg-gym-primary hover:text-white rounded-xl transition-all text-gray-400"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2.5 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all text-gray-400"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-500">
                                            <Dumbbell size={48} strokeWidth={1} />
                                            <p className="font-medium italic">No se registró equipamiento aún</p>
                                        </div>
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
