
import React, { useState, useEffect } from 'react';
import { 
    Printer, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    FileText,
    Loader2
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const { user } = useAuth();
    const gymName = user?.gym?.name || 'Gimnasio';

    const fetchReport = async () => {
        try {
            setLoading(true);
            const params = reportType === 'daily' 
                ? { type: 'daily', date: selectedDate }
                : { type: 'monthly', month: selectedMonth, year: selectedYear };
            
            const response = await api.get('/reports/detailed', { params });
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportType, selectedDate, selectedMonth, selectedYear]);

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
    };

    return (
        <div className="space-y-6 print:m-0 print:p-0">
            {/* Header / Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gym-primary/10 rounded-2xl flex items-center justify-center">
                            <FileText className="text-gym-primary" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{gymName} - Reportes</h1>
                            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Análisis de ingresos y egresos</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => setReportType('daily')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all",
                                    reportType === 'daily' ? "bg-white dark:bg-slate-800 text-gym-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-gray-400"
                                )}
                            >
                                Diario
                            </button>
                            <button
                                onClick={() => setReportType('monthly')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all",
                                    reportType === 'monthly' ? "bg-white dark:bg-slate-800 text-gym-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-gray-400"
                                )}
                            >
                                Mensual
                            </button>
                        </div>

                        {reportType === 'daily' ? (
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 outline-none"
                            />
                        ) : (
                            <div className="flex gap-2">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 outline-none"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-gym-primary/20 outline-none"
                                >
                                    {[2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            onClick={handlePrint}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-black/10"
                        >
                            <Printer size={16} />
                            Imprimir / PDF
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-gym-primary" size={48} />
                    <p className="text-slate-500 font-black uppercase italic tracking-widest">Generando reporte...</p>
                </div>
            ) : reportData ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="text-emerald-500" size={20} />
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ingresos</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(reportData.summary.totalIncome)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium italic">Total percibido en el periodo</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingDown className="text-red-500" size={20} />
                                </div>
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Egresos</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(reportData.summary.totalExpenses)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium italic">Total gastado en el periodo</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gym-primary/20 dark:border-gym-primary/20 shadow-xl shadow-gym-primary/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-gym-primary/10 rounded-xl flex items-center justify-center">
                                    <DollarSign className="text-gym-primary" size={20} />
                                </div>
                                <span className="text-[10px] font-black text-gym-primary uppercase tracking-widest">Balance Neto</span>
                            </div>
                            <h3 className={cn(
                                "text-3xl font-black tracking-tight",
                                reportData.summary.balance >= 0 ? "text-slate-900 dark:text-white" : "text-red-500"
                            )}>
                                {formatCurrency(reportData.summary.balance)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium italic">Utilidad del periodo</p>
                        </div>
                    </div>

                    {/* Print Summary (Compact) */}
                    <div className="hidden print:grid grid-cols-3 gap-4 mb-8 border-y-2 border-slate-900 py-4">
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-500">Total Ingresos</span>
                            <div className="text-xl font-black text-emerald-600">{formatCurrency(reportData.summary.totalIncome)}</div>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-500">Total Egresos</span>
                            <div className="text-xl font-black text-red-600">{formatCurrency(reportData.summary.totalExpenses)}</div>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-500">Balance Neto</span>
                            <div className="text-xl font-black text-slate-900">{formatCurrency(reportData.summary.balance)}</div>
                        </div>
                    </div>

                    {/* Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
                        {/* Income Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden print:mb-8 print:border-none print:shadow-none">
                            <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between print:p-0 print:mb-4 print:border-none">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                                    <TrendingUp className="text-emerald-500 print:hidden" size={18} />
                                    DETALLE DE INGRESOS
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm print:text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-400 print:bg-slate-100 print:text-slate-900">
                                            <th className="px-6 py-4 print:px-2">Fecha</th>
                                            <th className="px-6 py-4 print:px-2">Descripción / Categoría</th>
                                            <th className="px-6 py-4 text-right print:px-2 whitespace-nowrap">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 print:divide-slate-200">
                                        {reportData.details.income.length > 0 ? (
                                            reportData.details.income.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-gray-400 text-xs print:px-2 print:text-slate-900">
                                                        {formatDate(item.date)}
                                                    </td>
                                                    <td className="px-6 py-4 print:px-2">
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {item.category === 'MEMBERSHIP' ? 'MEMBRESÍA' : 
                                                             item.category === 'SPECIAL_CLASS' ? 'CLASE ESPECIAL' : 
                                                             item.category === 'OTHER' ? 'OTRO' : item.category}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 italic max-w-[200px] truncate print:max-w-none print:text-slate-600">{item.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-emerald-500 print:px-2 print:text-slate-900 whitespace-nowrap">
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">No hay ingresos registrados</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expense Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden print:border-none print:shadow-none">
                            <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between print:p-0 print:mb-4 print:border-none">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                                    <TrendingDown className="text-red-500 print:hidden" size={18} />
                                    DETALLE DE EGRESOS
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm print:text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-400 print:bg-slate-100 print:text-slate-900">
                                            <th className="px-6 py-4 print:px-2">Fecha</th>
                                            <th className="px-6 py-4 print:px-2">Descripción / Categoría</th>
                                            <th className="px-6 py-4 text-right print:px-2 whitespace-nowrap">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 print:divide-slate-200">
                                        {reportData.details.expenses.length > 0 ? (
                                            reportData.details.expenses.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-gray-400 text-xs print:px-2 print:text-slate-900">
                                                        {formatDate(item.date)}
                                                    </td>
                                                    <td className="px-6 py-4 print:px-2">
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {item.category === 'MEMBERSHIP' ? 'MEMBRESÍA' : 
                                                             item.category === 'SPECIAL_CLASS' ? 'CLASE ESPECIAL' : 
                                                             item.category === 'OTHER' ? 'OTRO' : item.category}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 italic max-w-[200px] truncate print:max-w-none print:text-slate-600">{item.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-red-500 print:px-2 print:text-slate-900 whitespace-nowrap">
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">No hay egresos registrados</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

            {/* Print Only Header */}
                    <div className="hidden print:flex items-center justify-between fixed top-0 left-0 right-0 p-0 mb-8 border-b-4 border-slate-900 pb-4">
                        <div>
                            <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">{gymName}</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">REPORTE FINANCIERO OFICIAL</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-black uppercase text-slate-900">Historial de Caja</h2>
                            <p className="text-sm font-black text-slate-900 italic">
                                {reportType === 'daily' 
                                    ? `Fecha: ${selectedDate.split('-').reverse().join('/')}` 
                                    : `Periodo: ${new Date(0, selectedMonth-1).toLocaleString('es-ES', {month: 'long'})} ${selectedYear}`}
                            </p>
                            <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Generado por: {user?.name} | {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </>
            ) : null}

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { 
                        margin: 0.5cm;
                        size: portrait;
                    }
                    
                    /* Force the layout to take full width and remove parent constraints */
                    html, body, #root, #root > div {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    
                    body { 
                        background: white !important; 
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    /* Kill any sidebars or navigation containers */
                    aside, nav, header {
                        display: none !important;
                    }

                    /* Reset the main container's padding/margins absolutely */
                    main, 
                    .container,
                    .space-y-6,
                    div[class*="flex-1"] {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        transform: none !important;
                    }

                    .print\\:hidden { display: none !important; }
                    
                    /* Optimization for tables */
                    table { 
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 10pt;
                    }
                    th {
                        background-color: #f8fafc !important;
                        border-bottom: 2px solid #000 !important;
                        padding: 8pt 4pt !important;
                        text-align: left !important;
                        font-weight: 900 !important;
                        color: #000 !important;
                    }
                    td {
                        border-bottom: 1px solid #e2e8f0 !important;
                        padding: 6pt 4pt !important;
                        color: #000 !important;
                    }
                    tr { page-break-inside: avoid; }
                    
                    /* Layout for print */
                    .grid { display: block !important; }
                    .lg\\:grid-cols-2 { display: block !important; }
                    
                    /* Fixed positions in print */
                    .fixed { position: static !important; }
                }
            `}</style>
        </div>
    );
};

export default Reports;
