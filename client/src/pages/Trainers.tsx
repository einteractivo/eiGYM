import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Dumbbell, Mail, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import UserModal from '../components/UserModal';

const Trainers: React.FC = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrainer, setSelectedTrainer] = useState<any>(null);

    const fetchTrainers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            // Filter only TRAINERS (and optionally ADMINS who train, but let's stick to TRAINER role)
            const trainerUsers = response.data.filter((u: any) => u.role === 'TRAINER');
            setTrainers(trainerUsers);
        } catch (error) {
            console.error('Error fetching trainers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainers();
    }, []);

    const handleNewTrainer = () => {
        setSelectedTrainer(null);
        setIsModalOpen(true);
    };

    const handleEditTrainer = (trainer: any) => {
        setSelectedTrainer(trainer);
        setIsModalOpen(true);
    };

    const handleDeleteTrainer = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar a este entrenador?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchTrainers();
        } catch (error) {
            console.error('Error deleting trainer:', error);
            alert('No se pudo eliminar el entrenador porque puede tener horarios asignados.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gym-primary/10 rounded-2xl flex items-center justify-center">
                        <Dumbbell className="text-gym-primary" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Entrenadores</h1>
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Gestión del equipo de instructores</p>
                    </div>
                </div>
                <button
                    onClick={handleNewTrainer}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gym-primary/20 uppercase tracking-widest text-xs"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nuevo Entrenador
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin"></div>
                </div>
            ) : trainers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-gray-100 dark:border-white/5">
                    <Dumbbell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay entrenadores registrados</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Agrega tu primer entrenador para asignarlo a las clases.</p>
                    <button
                        onClick={handleNewTrainer}
                        className="text-gym-primary font-bold hover:underline"
                    >
                        + Crear Entrenador
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {trainers.map((trainer: any) => (
                        <div key={trainer.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleEditTrainer(trainer)}
                                    className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteTrainer(trainer.id)}
                                    className="p-2 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-gym-primary/20 to-gym-primary/5 rounded-full flex items-center justify-center text-gym-primary border-4 border-white dark:border-slate-800 shadow-md">
                                    <span className="text-3xl font-black uppercase italic">{trainer.name?.charAt(0)}</span>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{trainer.name}</h3>
                                    <p className="text-xs font-bold text-gym-primary uppercase tracking-widest mt-1">Instructor</p>
                                </div>

                                <div className="w-full space-y-2 pt-4 border-t border-gray-50 dark:border-white/5 text-left">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                                        <Mail size={14} className="text-gym-primary" />
                                        <span className="truncate">{trainer.email}</span>
                                    </div>
                                    {trainer.notes && (
                                        <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-gray-400">
                                            <UserIcon size={14} className="text-gym-primary shrink-0 mt-0.5" />
                                            <p className="line-clamp-2 italic text-xs">{trainer.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTrainers}
                userToEdit={selectedTrainer}
                initialRole="TRAINER"
            />
        </div>
    );
};

export default Trainers;
