import React from 'react';
import { MonitorOff, Phone, Mail, Copy, Check } from 'lucide-react';

const UnauthorizedMachine: React.FC = () => {
    const [copied, setCopied] = React.useState(false);
    const machineId = localStorage.getItem('current_machine_id') || '';

    const handleCopy = () => {
        if (!machineId) return;
        navigator.clipboard.writeText(machineId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-amber-500/30">
                <div className="flex justify-center mb-6">
                    <div className="bg-amber-500/10 p-4 rounded-full">
                        <MonitorOff className="w-12 h-12 text-amber-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">
                    Acceso No Autorizado
                </h1>

                <p className="text-gray-400 mb-8">
                    Esta PC no tiene autorización para ejecutar el sistema **eiGYM**.
                    La licencia está vinculada a una única computadora registrada.
                </p>

                <div className="bg-black/20 rounded-xl p-4 mb-8 text-left">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">ID de esta PC para registro:</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-amber-500 text-xs break-all select-all font-mono font-bold">
                            {machineId || 'Cargando ID...'}
                        </code>
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-amber-500"
                            title="Copiar ID"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-4 mb-4">
                    <a href="https://wa.me/51952372009" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 text-gray-300 hover:text-green-500 transition-colors">
                        <Phone className="w-5 h-5 text-blue-500" />
                        <span>+51 952 372 009</span>
                    </a>
                    <div className="flex items-center justify-center gap-3 text-gray-300">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <span>soporte@eigym.com</span>
                    </div>
                </div>

                <button
                    onClick={() => window.location.href = '/login'}
                    className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                    Volver al Inicio de Sesión
                </button>
            </div>
        </div>
    );
};

export default UnauthorizedMachine;
