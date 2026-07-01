import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface SaleReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
}

const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({ isOpen, onClose, sale }) => {
    const [gymSettings, setGymSettings] = useState<any>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            api.get('/settings').then(res => setGymSettings(res.data)).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen || !sale) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-[0_20px_70px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/10">
                {/* Header - Not for Print */}
                <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 print:hidden bg-white relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Venta Exitosa</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Comprobante generado</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-slate-900 transition-all hover:bg-gray-50 rounded-2xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="p-10 overflow-y-auto print:p-0 print:overflow-visible flex-1 receipt-container text-slate-900">
                    <div id="printable-receipt" className="space-y-8">
                        {/* Gym Info */}
                        <div className="text-center space-y-3 pb-8 border-b-2 border-dashed border-gray-100 relative">
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full translate-y-1/2" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full translate-y-1/2" />
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                                {gymSettings?.gym_name || user?.gym?.name || 'GIMNASIO CENTRAL'}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">
                                {gymSettings?.gym_address || 'Calle Principal 123, Ciudad'}<br />
                                TEL: {gymSettings?.gym_phone || '900 000 000'}
                            </p>
                        </div>

                        {/* Sale Info */}
                        <div className="grid grid-cols-2 gap-y-3 text-[11px] font-bold uppercase tracking-tight">
                            <div className="text-slate-400 tracking-[0.1em]">No Ticket</div>
                            <div className="text-right text-slate-900 font-black italic">#{sale.id.toString().padStart(6, '0')}</div>
                            <div className="text-slate-400 tracking-[0.1em]">Fecha/Hora</div>
                            <div className="text-right text-slate-900">{format(new Date(sale.date), 'dd/MM/yy • HH:mm', { locale: es })}</div>
                            {sale.member && (
                                <>
                                    <div className="text-slate-400 tracking-[0.1em] mt-2 py-2 border-t border-gray-50">Cliente</div>
                                    <div className="text-right text-slate-900 font-black mt-2 py-2 border-t border-gray-50">{sale.member.firstName} {sale.member.lastName}</div>
                                    <div className="text-slate-400 tracking-[0.1em]">Identidad</div>
                                    <div className="text-right text-slate-900 font-black">{sale.member.dni}</div>
                                </>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="border-y-2 border-dashed border-gray-100 py-6 relative">
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full -translate-y-1/2" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full -translate-y-1/2" />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full translate-y-1/2" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full translate-y-1/2" />
                            <table className="w-full text-[11px] font-bold">
                                <thead>
                                    <tr className="text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
                                        <th className="text-left pb-4">DETALLE</th>
                                        <th className="text-center pb-4">CANT</th>
                                        <th className="text-right pb-4">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sale.items.map((item: any, idx: number) => (
                                        <tr key={idx} className="group">
                                            <td className="py-3">
                                                <div className="text-slate-900 uppercase tracking-tight font-black">{item.product?.name || 'Producto'}</div>
                                                <div className="text-[9px] text-slate-400 mt-0.5">S/ {parseFloat(item.priceAtSale).toFixed(2)} unit.</div>
                                            </td>
                                            <td className="py-3 text-center text-slate-900">{item.quantity}</td>
                                            <td className="py-3 text-right font-black italic text-slate-900">
                                                S/ {(item.quantity * parseFloat(item.priceAtSale)).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center text-slate-900 pb-2">
                                <span className="uppercase tracking-[0.2em] text-slate-400 text-[10px] font-black">Monto Total</span>
                                <span className="text-3xl font-black italic tracking-tighter"><span className="text-gym-primary text-sm not-italic mr-1">S/</span>{parseFloat(sale.total).toFixed(2)}</span>
                            </div>

                            {sale.paymentMethod === 'CASH' && (
                                <div className="space-y-2 pt-4 border-t-2 border-dashed border-gray-100 mt-2">
                                    <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold">
                                        <span className="uppercase tracking-widest leading-none">Recibido</span>
                                        <span className="leading-none">S/ {parseFloat(sale.amountReceived || sale.total).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-900 text-[11px] font-black">
                                        <span className="uppercase tracking-widest leading-none">Vuelto</span>
                                        <span className="italic leading-none">S/ {parseFloat(sale.change || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-8 space-y-4 border-t border-gray-50">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">¡Gracias por entrenar con nosotros!</p>
                            <div className="flex justify-center opacity-30">
                                <div className="flex gap-1">
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} className="w-[2px] bg-slate-900" style={{ height: ((i * 17 + 10) % 20) + 10 }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Button - Not for Print */}
                <div className="p-10 bg-white border-t border-gray-100 print:hidden flex gap-4 relative z-10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-gray-50 transition-all border-2 border-transparent hover:border-gray-100"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-slate-200 uppercase tracking-widest text-[10px]"
                    >
                        <Printer size={18} />
                        <span>Imprimir Ticket</span>
                    </button>
                </div>

                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-receipt, #printable-receipt * {
                            visibility: visible;
                        }
                        #printable-receipt {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 80mm;
                            margin: 0;
                            padding: 10mm;
                        }
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default SaleReceiptModal;
