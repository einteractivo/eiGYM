import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SaleReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
}

const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({ isOpen, onClose, sale }) => {
    if (!isOpen || !sale) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header - Not for Print */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 print:hidden bg-gray-50/50">
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                        <CheckCircle2 size={20} />
                        <span>Venta Exitosa</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible flex-1 receipt-container text-gray-800">
                    <div id="printable-receipt" className="space-y-6">
                        {/* Gym Info */}
                        <div className="text-center space-y-2 pb-6 border-b border-dashed border-gray-200">
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                                eiGYM <span className="text-gym-primary">Fitness</span>
                            </h2>
                            <p className="text-[10px] text-gray-500 font-mono leading-tight">
                                Calle Principal 123, Ciudad<br />
                                RUC: 20600000000<br />
                                Tel: +51 900 000 000
                            </p>
                        </div>

                        {/* Sale Info */}
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                            <div className="text-gray-500 uppercase font-bold tracking-widest text-[10px]">Ticket No:</div>
                            <div className="text-right font-mono">#{sale.id.toString().padStart(6, '0')}</div>
                            <div className="text-gray-500 uppercase font-bold tracking-widest text-[10px]">Fecha:</div>
                            <div className="text-right">{format(new Date(sale.date), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                            {sale.member && (
                                <>
                                    <div className="text-gray-500 uppercase font-bold tracking-widest text-[10px]">Cliente:</div>
                                    <div className="text-right font-bold">{sale.member.firstName} {sale.member.lastName}</div>
                                    <div className="text-gray-500 uppercase font-bold tracking-widest text-[10px]">DNI:</div>
                                    <div className="text-right font-mono">{sale.member.dni}</div>
                                </>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="border-y border-dashed border-gray-200 py-4">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-gray-400 uppercase text-[9px] font-black tracking-widest">
                                        <th className="text-left pb-2">Cant</th>
                                        <th className="text-left pb-2">Producto</th>
                                        <th className="text-right pb-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sale.items.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="py-2 align-top">{item.quantity}</td>
                                            <td className="py-2">
                                                <div className="font-bold uppercase leading-tight">{item.product?.name || 'Producto'}</div>
                                                <div className="text-[10px] text-gray-400">S/ {parseFloat(item.priceAtSale).toFixed(2)} c/u</div>
                                            </td>
                                            <td className="py-2 text-right align-top font-bold">
                                                S/ {(item.quantity * parseFloat(item.priceAtSale)).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center text-sm font-black italic">
                                <span className="uppercase tracking-widest text-gray-500 text-xs">Total a Pagar</span>
                                <span className="text-xl">S/ {parseFloat(sale.total).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-8 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">¡Gracias por su compra!</p>
                            <div className="flex justify-center">
                                <div className="w-32 h-8 bg-gray-100 rounded flex items-center justify-center">
                                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Button - Not for Print */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 print:hidden flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-[2] bg-gym-primary hover:bg-gym-primary/90 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                    >
                        <Printer size={20} />
                        <span>Imprimir Comprobante</span>
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
