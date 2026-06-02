import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Users } from 'lucide-react';
import api from '../services/api';
import PlanModal from '../components/PlanModal';

interface Plan {
    id: number;
    name: string;
    durationDays: number;
    price: string;
    description: string;
    active: boolean;
    _count?: {
        memberships: number;
    };
}

const PlansManagement: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);

    const fetchPlans = async () => {
        try {
            const response = await api.get('/plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (plan?: Plan) => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlan(undefined);
    };

    const handleSuccess = () => {
        fetchPlans();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de desactivar este plan?')) return;
        try {
            await api.delete(`/plans/${id}`);
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    
                    <p className="text-gray-400 dark:text-gray-500 mt-1">Configura los paquetes disponibles para tus clientes</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gym-primary hover:bg-gym-primary/90 text-white dark:text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                >
                    <Plus size={20} />
                    <span>Nuevo Plan</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-3xl p-6 hover:border-gym-primary/50 dark:hover:border-gym-primary/50 transition-all group relative overflow-hidden shadow-sm shadow-gray-100 dark:shadow-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gym-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                            <span className="bg-gray-100 dark:bg-white/5 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                ID: {plan.id}
                            </span>
                        </div>

                        <div className="text-3xl font-bold text-slate-900 dark:text-white mb-6 flex items-baseline gap-1">
                            <span className="text-base text-gray-400">S/</span>
                            {plan.price}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                <Clock size={18} className="text-gym-primary" />
                                <span>{plan.durationDays} días de duración</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                <Users size={18} className="text-gym-primary" />
                                <span className="font-bold">{plan._count?.memberships || 0} socios inscritos</span>
                            </div>
                            {plan.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2 italic">
                                    {plan.description}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={() => handleOpenModal(plan)}
                                className="flex-1 bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-gym-primary hover:text-white dark:hover:text-slate-900 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 text-slate-400 dark:text-gray-500"
                            >
                                <Edit2 size={16} />
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="bg-red-50 dark:bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all border border-red-100 dark:border-red-500/20"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {loading && plans.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin" />
                        <p className="text-gray-500">Cargando planes...</p>
                    </div>
                )}
            </div>

            <PlanModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                plan={selectedPlan}
            />
        </div>
    );
};

export default PlansManagement;
