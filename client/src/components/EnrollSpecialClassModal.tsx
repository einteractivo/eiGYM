import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import SpecialClassService, { type SpecialClass } from '../services/SpecialClassService';
import MemberService, { type Member } from '../services/MemberService';

interface EnrollSpecialClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    specialClass: SpecialClass | undefined;
}

const EnrollSpecialClassModal: React.FC<EnrollSpecialClassModalProps> = ({ isOpen, onClose, onSuccess, specialClass }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [loading, setLoading] = useState(false);
    const [discountType, setDiscountType] = useState<'NONE' | 'PERCENTAGE' | 'FIXED'>('NONE');
    const [discountValue, setDiscountValue] = useState<number>(0);

    const calculateFinalPrice = () => {
        if (!specialClass) return 0;
        const basePrice = Number(specialClass.price) || 0;
        if (discountType === 'PERCENTAGE') {
            const discountAmount = basePrice * (discountValue / 100);
            return Math.max(0, basePrice - discountAmount);
        } else if (discountType === 'FIXED') {
            return Math.max(0, basePrice - discountValue);
        }
        return basePrice;
    };

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
            setSearchTerm('');
            setSelectedMember(null);
            setPaymentMethod('CASH');
            setDiscountType('NONE');
            setDiscountValue(0);
        }
    }, [isOpen]);

    const fetchMembers = async () => {
        try {
            const data = await MemberService.getAll();
            setMembers(data);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember || !specialClass) return;

        setLoading(true);
        try {
            await SpecialClassService.enroll(specialClass.id, {
                memberId: selectedMember.id,
                paymentMethod,
                amount: calculateFinalPrice(),
                type: 'SPECIAL_CLASS'
            });
            onSuccess();
            onClose();
            alert('¡Inscripción y pago registrados correctamente!');
        } catch (error: any) {
            console.error('Error enrolling member:', error);
            const serverMsg = error.response?.data?.error || error.response?.data?.message || 'Verifica si ya está inscrito.';
            alert(`Ocurrió un error al inscribir al miembro. Detalle: ${serverMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m =>
        `${m.firstName} ${m.lastName} ${m.dni}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen || !specialClass) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-[95%] sm:w-full max-w-lg p-5 sm:p-8 flex flex-col max-h-[95vh] sm:max-h-[90vh] shadow-2xl border border-gray-100 dark:border-white/10 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Inscribir en Clase</h2>
                        <p className="text-xs sm:text-sm font-black text-gym-primary mt-1 uppercase tracking-widest">{specialClass.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">1. Buscar Miembro Existente</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por DNI o Nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-3 dark:text-white focus:ring-2 focus:ring-gym-primary"
                            />
                        </div>

                        {!selectedMember && searchTerm.length > 2 && (
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {filteredMembers.slice(0, 10).map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedMember(member)}
                                        className="w-full text-left p-3 rounded-xl hover:bg-gym-primary/10 border border-transparent hover:border-gym-primary/20 transition-all flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-500 shrink-0">
                                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold dark:text-white">{member.firstName} {member.lastName}</p>
                                            <p className="text-xs text-gray-500">DNI: {member.dni}</p>
                                        </div>
                                    </button>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <p className="text-center text-sm text-gray-500 py-4">No se encontraron miembros.</p>
                                )}
                            </div>
                        )}

                        {selectedMember && (
                            <div className="bg-gym-primary/10 border border-gym-primary/20 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gym-primary mb-1 uppercase">Miembro Seleccionado</p>
                                    <p className="font-bold dark:text-white text-lg">{selectedMember.firstName} {selectedMember.lastName}</p>
                                    <p className="text-sm text-gray-500">DNI: {selectedMember.dni}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="text-red-500 hover:text-red-600 font-bold p-2 bg-red-100 rounded-lg"
                                >
                                    Cambiar
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 italic">
                            *Si es un miembro nuevo, regístralo primero en la sección de Miembros.
                        </p>
                    </div>

                    {selectedMember && (
                        <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Descuento (Opcional)</label>
                            <div className="flex gap-3 mb-2">
                                <select
                                    value={discountType}
                                    onChange={(e) => {
                                        setDiscountType(e.target.value as any);
                                        setDiscountValue(0);
                                    }}
                                    className={`bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 dark:text-white focus:ring-2 focus:ring-gym-primary font-bold appearance-none transition-all ${discountType !== 'NONE' ? 'w-1/2' : 'w-full'}`}
                                >
                                    <option value="NONE" className="dark:bg-slate-900">Sin Descuento</option>
                                    <option value="PERCENTAGE" className="dark:bg-slate-900">Porcentaje (%)</option>
                                    <option value="FIXED" className="dark:bg-slate-900">Monto (S/)</option>
                                </select>

                                {discountType !== 'NONE' && (
                                    <input
                                        type="number"
                                        min="0"
                                        step={discountType === 'PERCENTAGE' ? "1" : "0.5"}
                                        value={discountValue === 0 ? '' : discountValue}
                                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                        placeholder={discountType === 'PERCENTAGE' ? "Ej. 10%" : "Ej. 5.00"}
                                        className="w-1/2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 dark:text-white focus:ring-2 focus:ring-gym-primary font-bold text-center transition-all"
                                    />
                                )}
                            </div>

                            {/* PRECIO FINAL DESTACADO */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-6 mt-6 flex flex-col items-center justify-center relative overflow-hidden group">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-2">Total a Pagar</span>
                                <div className="flex items-end gap-3">
                                    {calculateFinalPrice() < Number(specialClass.price) && (
                                        <span className="text-xl font-bold text-gray-300 dark:text-gray-600 line-through mb-1">
                                            S/ {Number(specialClass.price).toFixed(2)}
                                        </span>
                                    )}
                                    <span className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                        <span className="text-gym-primary mr-1">S/</span>
                                        {calculateFinalPrice().toFixed(2)}
                                    </span>
                                </div>
                                {discountType !== 'NONE' && discountValue > 0 && (
                                    <div className="absolute top-4 right-4 bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest animate-pulse">
                                        Descuento Aplicado
                                    </div>
                                )}
                            </div>

                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 pt-6 border-t border-gray-100 dark:border-slate-800">2. Método de Pago</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={`font-bold py-3 px-4 rounded-xl transition-all border ${paymentMethod === method
                                                ? 'bg-gym-primary/10 border-gym-primary text-gym-primary dark:text-gym-primary'
                                                : 'bg-gray-50 dark:bg-slate-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {method === 'CASH' ? 'Efectivo' : method === 'CARD' ? 'Tarjeta' : method === 'TRANSFER' ? 'Transferencia' : method}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-6 shrink-0 mt-4 border-t dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-4 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleEnroll}
                        disabled={loading || !selectedMember}
                        className="flex-1 px-4 py-4 bg-gym-primary text-white font-black rounded-2xl hover:bg-gym-primary/90 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-sm shadow-xl shadow-gym-primary/20 active:scale-[0.98]"
                    >
                        {loading ? 'Procesando...' : 'Cobrar e Inscribir'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrollSpecialClassModal;
