import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Dumbbell } from 'lucide-react';
import GymClassService, { type GymClass } from '../services/GymClassService';
import ClassModal from '../components/ClassModal';

const ClassesPage: React.FC = () => {
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<GymClass | undefined>(undefined);

    const fetchClasses = async () => {
        try {
            const data = await GymClassService.getAllClasses();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleOpenModal = (gymClass?: GymClass) => {
        setSelectedClass(gymClass);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedClass(undefined);
    };

    const handleSuccess = () => {
        fetchClasses();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta clase?')) return;
        try {
            await GymClassService.deleteClass(id);
            fetchClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
            alert('Error al eliminar la clase');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    
                    <p className="text-gray-400 dark:text-gray-500 mt-1">Define las disciplinas y actividades ofrecidas en el gimnasio</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white dark:text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20 dark:shadow-none"
                >
                    <Plus size={20} />
                    <span>Nueva Clase</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <div key={cls.id} className={`bg-white dark:bg-slate-900 backdrop-blur-md border ${cls.active ? 'border-gray-100 dark:border-white/5' : 'border-red-500/20'} rounded-3xl p-6 hover:border-gym-primary/50 dark:hover:border-gym-primary/50 transition-all group relative overflow-hidden shadow-sm shadow-gray-100 dark:shadow-none`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gym-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-4">
                            <div 
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: cls.color || '#7C3AED', color: '#FFF' }}
                            >
                                <Dumbbell size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${cls.active ? 'bg-green-50 dark:bg-green-500/10 text-green-500' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
                                {cls.active ? 'ACTIVA' : 'INACTIVA'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white uppercase tracking-tight">{cls.name}</h3>

                        <p className="text-sm text-gray-400 dark:text-gray-500 line-clamp-3 h-12 mb-6 font-medium italic">
                            {cls.description || 'Sin descripción disponible.'}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleOpenModal(cls)}
                                className="flex-1 bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-gym-primary hover:text-white dark:hover:text-slate-900 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-slate-400 dark:text-gray-500"
                            >
                                <Edit2 size={16} />
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(cls.id)}
                                className="bg-red-50 dark:bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all border border-red-500/10"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {loading && classes.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin" />
                        <p className="text-gray-500">Cargando clases...</p>
                    </div>
                )}

                {!loading && classes.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[3rem]">
                        <Dumbbell size={48} className="text-gray-200 dark:text-gray-800" />
                        <div className="text-center">
                            <p className="text-gray-400 dark:text-gray-600 font-medium uppercase text-xs tracking-widest font-black">No hay clases configuradas</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700 uppercase font-bold mt-1">Comienza creando tu primera disciplina</p>
                        </div>
                    </div>
                )}
            </div>

            <ClassModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                gymClass={selectedClass}
            />
        </div>
    );
};

export default ClassesPage;
