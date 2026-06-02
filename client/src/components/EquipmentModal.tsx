import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Dumbbell } from 'lucide-react';
import EquipmentService, { type Equipment } from '../services/EquipmentService';

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    equipment?: Equipment | null;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose, onSuccess, equipment }) => {
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        status: 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
        location: string;
        purchaseDate: string;
        lastMaintenance: string;
        notes: string;
        photoUrl: string;
    }>({
        name: '',
        description: '',
        status: 'OPERATIONAL',
        location: '',
        purchaseDate: '',
        lastMaintenance: '',
        notes: '',
        photoUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (equipment) {
            setFormData({
                name: equipment.name,
                description: equipment.description || '',
                status: equipment.status,
                location: equipment.location || '',
                purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.split('T')[0] : '',
                lastMaintenance: equipment.lastMaintenance ? equipment.lastMaintenance.split('T')[0] : '',
                notes: equipment.notes || '',
                photoUrl: equipment.photoUrl || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                status: 'OPERATIONAL',
                location: '',
                purchaseDate: '',
                lastMaintenance: '',
                notes: '',
                photoUrl: ''
            });
        }
    }, [equipment, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (equipment) {
                await EquipmentService.updateEquipment(equipment.id, formData);
            } else {
                await EquipmentService.createEquipment(formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al guardar el equipo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                <div className="flex justify-between items-center p-10 border-b border-gray-50 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gym-primary/10 rounded-2xl flex items-center justify-center">
                            <Dumbbell className="w-8 h-8 text-gym-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                                {equipment ? 'Editar Equipo' : 'Nuevo Equipo'}
                            </h2>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic mt-0.5">Registro Técnico y Seguimiento</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-gray-100 transition-all rounded-full"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} strokeWidth={2.5} />
                            <span className="text-sm font-bold uppercase tracking-tight">{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">Nombre de la Máquina / Equipo *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-bold text-lg placeholder:text-gray-300"
                                placeholder="Ej: Caminadora Matrix T-50"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">Estado Actual *</label>
                            <div className="relative">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-black uppercase tracking-widest text-xs cursor-pointer appearance-none shadow-sm"
                                >
                                    <option value="OPERATIONAL">🟢 Operativo</option>
                                    <option value="MAINTENANCE">🟠 Mantenimiento</option>
                                    <option value="OUT_OF_SERVICE">🔴 Fuera de Servicio</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">Ubicación / Área</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-bold text-sm placeholder:text-gray-300"
                                placeholder="Ej: Zona Cardiovascular"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">Fecha de Compra</label>
                            <input
                                type="date"
                                name="purchaseDate"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-bold text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">Último Mantenimiento</label>
                            <input
                                type="date"
                                name="lastMaintenance"
                                value={formData.lastMaintenance}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-bold text-sm"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">URL de la Imagen (Opcional)</label>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        name="photoUrl"
                                        value={formData.photoUrl}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none font-bold text-sm placeholder:text-gray-300"
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                    />
                                </div>
                                {formData.photoUrl && (
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 bg-white ring-4 ring-gray-50 flex-shrink-0">
                                        <img
                                            src={formData.photoUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100?text=Error')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">Descripción / Detalles Técnicos</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none min-h-[100px] font-medium placeholder:text-gray-300"
                                placeholder="Modelo, marca, número de serie..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 italic font-sans">Notas Adicionales</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-slate-900 focus:bg-white focus:border-gym-primary/30 focus:ring-4 focus:ring-gym-primary/5 transition-all outline-none min-h-[100px] font-medium placeholder:text-gray-300"
                                placeholder="Historial de fallas o notas especiales..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-gray-100 transition-all italic"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-12 py-5 rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-[10px] active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} strokeWidth={3} />
                            )}
                            <span>{equipment ? 'Actualizar Registro' : 'Guardar Equipo'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentModal;
