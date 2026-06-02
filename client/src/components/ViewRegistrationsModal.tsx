import React from 'react';
import { X, User, Calendar, Trash2 } from 'lucide-react';
import SpecialClassService, { type SpecialClass } from '../services/SpecialClassService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ViewRegistrationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    specialClass: SpecialClass | undefined;
    onUpdate: () => void;
}

const ViewRegistrationsModal: React.FC<ViewRegistrationsModalProps> = ({ isOpen, onClose, specialClass, onUpdate }) => {
    if (!isOpen || !specialClass) return null;

    const handleCancelRegistration = async (registrationId: number) => {
        if (!confirm('¿Estás seguro de cancelar esta inscripción?')) return;
        try {
            await SpecialClassService.cancelEnrollment(specialClass.id, registrationId);
            onUpdate();
        } catch (error) {
            console.error('Error cancelling registration:', error);
            alert('Error al cancelar la inscripción');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl p-8 flex flex-col max-h-[85vh] shadow-2xl border border-white/10">
                <div className="flex justify-between items-start mb-8 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight leading-none italic">
                            Inscritos: <span className="text-gym-primary">{specialClass.name}</span>
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <User size={12} /> {specialClass.registrations?.length || 0} registrados
                            </p>
                            {specialClass.capacity && (
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={12} /> Cupos: {specialClass.capacity}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {specialClass.registrations && specialClass.registrations.length > 0 ? (
                        specialClass.registrations.map((reg) => (
                            <div 
                                key={reg.id} 
                                className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
                                    reg.status === 'CANCELLED' 
                                    ? 'bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10 opacity-60' 
                                    : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gym-primary/30'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-lg shadow-sm ${
                                        reg.status === 'CANCELLED' 
                                        ? 'bg-red-100 text-red-500' 
                                        : 'bg-gym-primary text-slate-900'
                                    }`}>
                                        {reg.member?.firstName.charAt(0)}{reg.member?.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black dark:text-white uppercase tracking-tight">
                                            {reg.member?.firstName} {reg.member?.lastName}
                                        </p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] font-bold text-gray-400">DNI: {reg.member?.dni}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {format(new Date(reg.registrationDate), "dd MMM, HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {reg.status === 'CANCELLED' ? (
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-red-100 text-red-500 rounded-lg">Cancelado</span>
                                    ) : (
                                        <button
                                            onClick={() => handleCancelRegistration(reg.id)}
                                            className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                                            title="Cancelar Inscripción"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[2.5rem]">
                            <User size={48} className="text-gray-200 dark:text-gray-800" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Aún no hay inscritos</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                    >
                        Cerrar Lista
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewRegistrationsModal;
