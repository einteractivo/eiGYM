import React, { useEffect, useState } from 'react';
import { X, DollarSign, Users, Calendar, Printer } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyReportData {
    date: string;
    totalRevenue: number;
    totalsByMethod: {
        method: string;
        _sum: { amount: number };
    }[];
    newMembers: number;
    attendances: number;
    payments: {
        id: number;
        amount: number;
        method: string;
        type: string;
        date: string;
        member: {
            firstName: string;
            lastName: string;
            dni: string;
        };
    }[];
}

interface DailyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
    const [reportData, setReportData] = useState<DailyReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchReport();
        }
    }, [isOpen]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/stats/daily-report');
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching daily report:', error);
            setError('No se pudo cargar el reporte. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gym-dark border border-white/10 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Scrollable Container for Print targeting */}
                <div id="report-content" className="flex flex-col h-full bg-gym-dark">
                    {/* Header */}
                    <div className="p-6 bg-gym-primary text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <Calendar size={24} />
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight">Reporte Diario de Ventas</h2>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-widest whitespace-nowrap">
                                    {format(new Date(), "EEEE, d 'de' MMMM 'del' yyyy", { locale: es })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors no-print"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-gym-primary/30 border-t-gym-primary rounded-full animate-spin" />
                                <p className="text-gray-500 font-medium">Generando reporte...</p>
                            </div>
                        ) : error ? (
                            <div className="py-20 text-center space-y-4">
                                <p className="text-red-400 font-medium">{error}</p>
                                <button
                                    onClick={fetchReport}
                                    className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : reportData ? (
                            <>
                                {/* Summary Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl print:border-black print:bg-transparent">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-500/20 rounded-xl text-green-500 print:text-black">
                                                <DollarSign size={20} />
                                            </div>
                                            <span className="text-gray-400 font-bold text-sm uppercase print:text-black">Total Ingresos</span>
                                        </div>
                                        <p className="text-3xl font-black text-white print:text-black">
                                            S/ {Number(reportData.totalRevenue || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl print:border-black print:bg-transparent">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-500 print:text-black">
                                                <Users size={20} />
                                            </div>
                                            <span className="text-gray-400 font-bold text-sm uppercase print:text-black">Nuevos Miembros</span>
                                        </div>
                                        <p className="text-3xl font-black text-white print:text-black">
                                            {reportData.newMembers}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Methods */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest print:text-black">Desglose por Método</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {reportData.totalsByMethod.map((item) => (
                                            <div key={item.method} className="bg-white/5 p-4 rounded-2xl flex flex-col border border-white/5 capitalize print:border-black print:bg-transparent">
                                                <span className="text-gray-500 text-[10px] font-bold uppercase print:text-black">{item.method}</span>
                                                <span className="text-lg font-bold print:text-black">S/ {Number(item._sum.amount || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {reportData.totalsByMethod.length === 0 && (
                                            <p className="col-span-full text-center text-gray-600 italic text-sm py-2">Sin transacciones registradas</p>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed List */}
                                <div className="space-y-4 pb-10">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest print:text-black">Detalle de Ingresos</h3>
                                    <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden print:border-black print:bg-transparent print:rounded-none">
                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead className="bg-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-widest print:bg-gray-100 print:text-black">
                                                <tr>
                                                    <th className="py-3 px-4">Miembro / DNI</th>
                                                    <th className="py-3 px-4">Categoría</th>
                                                    <th className="py-3 px-4">Método</th>
                                                    <th className="py-3 px-4 text-right">Monto</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 print:divide-black/20">
                                                {reportData.payments.map((p) => (
                                                    <tr key={p.id}>
                                                        <td className="py-4 px-4 uppercase text-xs">
                                                            <div className="font-bold text-white print:text-black">
                                                                {p.member ? `${p.member.firstName} ${p.member.lastName}` : 'N/A'}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 print:text-black font-medium">
                                                                DNI: {p.member?.dni || '----'}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="px-2 py-1 bg-gym-primary/10 text-gym-primary rounded text-[9px] uppercase font-black print:text-black print:bg-transparent print:border print:border-black">
                                                                {p.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase font-bold text-gray-400 capitalize print:text-black">
                                                                {p.method}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-right font-black text-white print:text-black">
                                                            S/ {Number(p.amount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {reportData.payments.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-10 text-center text-gray-600 italic">
                                                            No hay pagos registrados hoy
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-black/40 border-t border-white/10 shrink-0 flex gap-4 no-print relative z-10">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
                    >
                        <Printer size={18} />
                        <span>Imprimir</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gym-primary text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-gym-primary/20"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    #report-content { 
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        color: black !important;
                        z-index: 9999;
                        visibility: visible !important;
                        overflow: visible !important;
                    }
                    * { visibility: hidden; }
                    #report-content, #report-content * { visibility: visible !important; }
                    .bg-gym-dark { background: white !important; }
                    .bg-gym-primary { background: #eab308 !important; color: black !important; border-bottom: 2px solid black !important; }
                    .text-white { color: black !important; }
                    .text-gray-400, .text-gray-500 { color: #333 !important; }
                    .border-white\\/10, .border-white\\/5 { border-color: #ddd !important; }
                    .rounded-3xl, .rounded-\\[2\\.5rem\\] { border-radius: 0 !important; }
                    table tr { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
};

export default DailyReportModal;
