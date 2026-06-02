import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Star, Users, Calendar, Banknote, List } from 'lucide-react';
import SpecialClassService, { type SpecialClass } from '../services/SpecialClassService';
import SpecialClassModal from '../components/SpecialClassModal';
import EnrollSpecialClassModal from '../components/EnrollSpecialClassModal';
import ViewRegistrationsModal from '../components/ViewRegistrationsModal';

const SpecialClassesPage: React.FC = () => {
    const [classes, setClasses] = useState<SpecialClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<SpecialClass | undefined>(undefined);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const data = await SpecialClassService.getAll();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching special classes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleOpenClassModal = (cls?: SpecialClass) => {
        setSelectedClass(cls);
        setIsClassModalOpen(true);
    };

    const handleOpenEnrollModal = (cls: SpecialClass) => {
        setSelectedClass(cls);
        setIsEnrollModalOpen(true);
    };

    const handleOpenViewModal = (cls: SpecialClass) => {
        setSelectedClass(cls);
        setIsViewModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta clase especial? Se eliminarán también los registros de inscripción.')) return;
        try {
            await SpecialClassService.delete(id);
            fetchClasses();
        } catch (error) {
            console.error('Error deleting special class:', error);
            alert('Error al eliminar la clase');
        }
    };

    const handleToggleActive = async (cls: SpecialClass) => {
        try {
            await SpecialClassService.update(cls.id, {
                ...cls,
                active: !cls.active
            });
            fetchClasses();
        } catch (error) {
            console.error('Error toggling active status:', error);
            alert('Error al cambiar el estado de la clase');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    
                    <p className="text-gray-400 dark:text-gray-500 mt-1">Talleres y clases independientes fuera de los planes regulares</p>
                </div>
                <button
                    onClick={() => handleOpenClassModal()}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white dark:text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20 dark:shadow-none"
                >
                    <Plus size={20} />
                    <span>Configurar Nueva Clase</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <div key={cls.id} className={`bg-white dark:bg-slate-900 border ${cls.active ? 'border-gray-100 dark:border-white/5' : 'border-red-500/20'} rounded-3xl p-6 hover:border-gym-primary/50 transition-all group relative overflow-hidden shadow-sm`}>
                        <div className="flex justify-between items-start mb-4">
                            <div 
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: cls.color || '#4F46E5', color: '#FFF' }}
                            >
                                <Star size={24} fill="currentColor" />
                            </div>
                            <button
                                onClick={() => handleToggleActive(cls)} 
                                className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer select-none ${cls.active ? 'bg-green-50 dark:bg-green-500/10 text-green-500 hover:bg-green-100 dark:hover:bg-green-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20'}`}
                                title={cls.active ? "Haz clic para Desactivar" : "Haz clic para Activar"}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${cls.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                {cls.active ? 'ACTIVA' : 'INACTIVA'}
                            </button>
                        </div>

                        <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white uppercase tracking-tight">{cls.name}</h3>
                        <p className="text-gym-primary font-black text-lg mb-3">S/ {Number(cls.price).toFixed(2)}</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar size={16} />
                                <span>{cls.schedule || 'Horario no definido'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Users size={16} />
                                <span>{cls.registrations?.length || 0} inscritos {cls.capacity ? `/ ${cls.capacity} cupos` : ''}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleOpenEnrollModal(cls)}
                                disabled={!cls.active}
                                className="w-full bg-gym-primary hover:bg-gym-primary/90 text-slate-900 font-black py-3 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                <Banknote size={16} />
                                Inscribir y Cobrar
                            </button>
                            <button
                                onClick={() => handleOpenViewModal(cls)}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-3 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                <List size={16} />
                                Ver Inscritos
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenClassModal(cls)}
                                    className="flex-1 bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-gray-800 text-gray-400 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={14} />
                                    Configurar
                                </button>
                                <button
                                    onClick={() => handleDelete(cls.id)}
                                    className="bg-red-50 dark:bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && classes.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin" />
                        <p className="text-gray-500">Cargando clases especiales...</p>
                    </div>
                )}

                {!loading && classes.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[3rem]">
                        <Star size={48} className="text-gray-200 dark:text-gray-800" />
                        <div className="text-center">
                            <p className="text-gray-400 dark:text-gray-600 font-black uppercase text-xs tracking-widest">No hay clases especiales</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700 uppercase font-bold mt-1">Ideal para talleres, clases maestras o eventos únicos</p>
                        </div>
                    </div>
                )}
            </div>

            <SpecialClassModal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
                onSuccess={fetchClasses}
                specialClass={selectedClass}
            />

            <EnrollSpecialClassModal
                isOpen={isEnrollModalOpen}
                onClose={() => setIsEnrollModalOpen(false)}
                onSuccess={fetchClasses}
                specialClass={selectedClass}
            />

            <ViewRegistrationsModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    fetchClasses(); // Refresh if something was cancelled
                }}
                specialClass={selectedClass}
                onUpdate={fetchClasses}
            />
        </div>
    );
};

export default SpecialClassesPage;
