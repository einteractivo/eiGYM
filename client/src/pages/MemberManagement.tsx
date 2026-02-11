import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Search,
    User,
    Edit,
    Trash2,
    MessageCircle,
    Info,
    Filter
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import MemberModal from '../components/MemberModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Member {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
    phone: string;
    email: string;
    status: 'ACTIVE' | 'INACTIVE';
    memberships: {
        id: number;
        startDate: string;
        endDate: string;
        plan: {
            name: string;
        };
    }[];
}

const MemberManagement: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/members?search=${search}`);
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const location = useLocation();

    useEffect(() => {
        if (location.state?.openModal) {
            handleOpenModal();
        }
    }, [location.state]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMembers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleOpenModal = (member?: Member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMember(undefined);
    };

    const handleSuccess = () => {
        fetchMembers();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este miembro? Esta acción no se puede deshacer.')) {
            try {
                await api.delete(`/members/${id}`);
                setMembers(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                console.error('Error deleting member:', error);
                alert('No se pudo eliminar el miembro. Por favor, inténtalo de nuevo.');
            }
        }
    };

    const handleWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Top Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all uppercase text-sm shadow-lg shadow-gym-primary/20"
                >
                    AGREGAR
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                        <span className="text-[10px] font-black text-gray-400 uppercase">TODOS</span>
                        <Filter size={16} className="text-gray-500" />
                    </div>
                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Ej: Nombre o Apellidos"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gym-primary/50 transition-all placeholder:text-gray-500"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-400 text-[11px] uppercase font-black tracking-widest border-b border-white/5">
                        <tr>
                            <th className="py-4 px-6 text-center w-20">
                                <div className="flex flex-col items-center gap-0.5 opacity-30">
                                    <div className="w-2.5 h-0.5 bg-gray-400 rounded-full" />
                                    <div className="w-2.5 h-0.5 bg-gray-400 rounded-full" />
                                </div>
                            </th>
                            <th className="py-4 px-6 text-center w-12 text-gray-500">NO</th>
                            <th className="py-4 px-6">NOMBRE</th>
                            <th className="py-4 px-6">APELLIDOS</th>
                            <th className="py-4 px-6 text-center">ULTIMO PAGO</th>
                            <th className="py-4 px-6 text-center">FECHA PAGAR</th>
                            <th className="py-4 px-6 text-center">ESTADO</th>
                            <th className="py-4 px-6 text-center">ACCION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={8} className="py-8 px-6">
                                        <div className="h-4 bg-white/5 rounded w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : members.length > 0 ? (
                            members.map((member, index) => {
                                const latestMembership = member.memberships[0];
                                return (
                                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 text-center">
                                            <div className="w-10 h-10 bg-white/5 rounded-full border border-white/10 flex items-center justify-center text-gray-400 mx-auto group-hover:bg-gym-primary/20 group-hover:text-gym-primary transition-colors">
                                                <User size={20} />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center font-bold text-gray-500 text-xs">
                                            {index + 1}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-white uppercase text-xs">
                                            {member.firstName}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-white uppercase text-xs">
                                            {member.lastName}
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-400 text-xs font-medium">
                                            {latestMembership
                                                ? format(new Date(latestMembership.startDate), "dd MMM yyyy", { locale: es }).toUpperCase()
                                                : '----'
                                            }
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-400 text-xs font-medium">
                                            {latestMembership
                                                ? format(new Date(latestMembership.endDate), "dd MMM yyyy", { locale: es }).toUpperCase()
                                                : '----'
                                            }
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn(
                                                "inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight",
                                                member.status === 'ACTIVE'
                                                    ? "bg-green-500/10 text-green-500"
                                                    : "bg-red-500/10 text-red-500"
                                            )}>
                                                {member.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleWhatsApp(member.phone)}
                                                    className="text-green-500 hover:text-green-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(member)}
                                                    className="text-blue-500 hover:text-blue-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    className="text-red-500 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    className="text-gym-primary hover:text-gym-primary/80 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                                                    title="Detalles"
                                                >
                                                    <Info size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={8} className="py-20 text-center text-gray-500 italic text-sm">
                                    No se encontraron miembros registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <MemberModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                member={selectedMember}
            />
        </div>
    );
};

export default MemberManagement;
